import {
  PublishCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  ListTopicsCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  ListSubscriptionsByTopicCommand,
  SetTopicAttributesCommand,
  GetTopicAttributesCommand,
  CreatePlatformApplicationCommand,
  CreatePlatformEndpointCommand,
  DeletePlatformApplicationCommand,
  DeleteEndpointCommand,
  GetEndpointAttributesCommand,
  SetEndpointAttributesCommand,
  ListPlatformApplicationsCommand,
  ListEndpointsByPlatformApplicationCommand,
  PublishBatchCommand,
} from '@aws-sdk/client-sns';
import { snsClient } from '../config';

export interface NotificationData {
  message: string;
  subject?: string;
  phoneNumber?: string;
  topicArn?: string;
  targetArn?: string;
  messageAttributes?: Record<string, any>;
}

export interface TopicData {
  name: string;
  displayName?: string;
  deliveryPolicy?: string;
}

export interface SubscriptionData {
  topicArn: string;
  protocol: 'sms' | 'email' | 'http' | 'https' | 'sqs' | 'lambda' | 'application';
  endpoint: string;
}

// New interfaces for mobile push notifications
export interface PlatformApplicationData {
  name: string;
  platform: 'APNS' | 'APNS_SANDBOX' | 'GCM' | 'FCM';
  attributes: {
    PlatformCredential: string; // Private key for APNS, Server Key for FCM/GCM
    PlatformPrincipal?: string; // Certificate for APNS, not used for FCM/GCM
  };
}

export interface PlatformEndpointData {
  platformApplicationArn: string;
  token: string; // Device token for APNS, Registration token for FCM
  customUserData?: string;
  attributes?: Record<string, string>;
}

export interface PushNotificationPayload {
  default: string; // Default message for unsupported platforms
  APNS?: APNSPayload;
  APNS_SANDBOX?: APNSPayload;
  GCM?: GCMPayload;
  FCM?: FCMPayload;
}

export interface APNSPayload {
  aps: {
    alert: {
      title?: string;
      subtitle?: string;
      body: string;
    };
    badge?: number;
    sound?: string;
    'content-available'?: number;
    'mutable-content'?: number;
    category?: string;
  };
  customData?: Record<string, any>;
}

export interface GCMPayload {
  data?: Record<string, string>;
  notification?: {
    title?: string;
    body: string;
    icon?: string;
    sound?: string;
    tag?: string;
    color?: string;
    click_action?: string;
  };
  priority?: 'normal' | 'high';
  time_to_live?: number;
  collapse_key?: string;
}

export interface FCMPayload {
  data?: Record<string, string>;
  notification?: {
    title?: string;
    body: string;
    image?: string;
  };
  android?: {
    priority?: 'normal' | 'high';
    ttl?: string;
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      click_action?: string;
      channel_id?: string;
    };
  };
  apns?: {
    headers?: Record<string, string>;
    payload?: {
      aps: APNSPayload['aps'];
    };
  };
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: Record<string, any>;
  };
}

export class SNSService {
  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber: string, message: string): Promise<{ messageId: string }> {
    try {
      const command = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      const result = await snsClient.send(command);
      return { messageId: result.MessageId! };
    } catch (error) {
      console.error('SNS send SMS error:', error);
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  /**
   * Publish message to topic
   */
  async publishToTopic(
    topicArn: string,
    message: string,
    subject?: string,
    messageAttributes?: Record<string, any>
  ): Promise<{ messageId: string }> {
    try {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        Subject: subject,
        MessageAttributes: messageAttributes ? Object.entries(messageAttributes).reduce((acc, [key, value]) => {
          acc[key] = {
            DataType: typeof value === 'string' ? 'String' : 'Number',
            StringValue: String(value),
          };
          return acc;
        }, {} as any) : undefined,
      });

      const result = await snsClient.send(command);
      return { messageId: result.MessageId! };
    } catch (error) {
      console.error('SNS publish to topic error:', error);
      throw new Error(`Failed to publish to topic: ${error}`);
    }
  }

  /**
   * Publish batch messages
   */
  async publishBatch(
    topicArn: string,
    messages: Array<{
      id: string;
      message: string;
      subject?: string;
      messageAttributes?: Record<string, any>;
    }>
  ): Promise<{ successful: string[]; failed: string[] }> {
    try {
      const command = new PublishBatchCommand({
        TopicArn: topicArn,
        PublishBatchRequestEntries: messages.map(msg => ({
          Id: msg.id,
          Message: msg.message,
          Subject: msg.subject,
          MessageAttributes: msg.messageAttributes ? Object.entries(msg.messageAttributes).reduce((acc, [key, value]) => {
            acc[key] = {
              DataType: typeof value === 'string' ? 'String' : 'Number',
              StringValue: String(value),
            };
            return acc;
          }, {} as any) : undefined,
        })),
      });

      const result = await snsClient.send(command);
      return {
        successful: result.Successful?.map(s => s.Id!) || [],
        failed: result.Failed?.map(f => f.Id!) || [],
      };
    } catch (error) {
      console.error('SNS publish batch error:', error);
      throw new Error(`Failed to publish batch messages: ${error}`);
    }
  }

  /**
   * Create SNS topic
   */
  async createTopic(topicData: TopicData): Promise<{ topicArn: string }> {
    try {
      const command = new CreateTopicCommand({
        Name: topicData.name,
        Attributes: {
          DisplayName: topicData.displayName || topicData.name,
          ...(topicData.deliveryPolicy && { DeliveryPolicy: topicData.deliveryPolicy }),
        },
      });

      const result = await snsClient.send(command);
      return { topicArn: result.TopicArn! };
    } catch (error) {
      console.error('SNS create topic error:', error);
      throw new Error(`Failed to create topic: ${error}`);
    }
  }

  /**
   * Delete SNS topic
   */
  async deleteTopic(topicArn: string): Promise<void> {
    try {
      const command = new DeleteTopicCommand({
        TopicArn: topicArn,
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('SNS delete topic error:', error);
      throw new Error(`Failed to delete topic: ${error}`);
    }
  }

  /**
   * List SNS topics
   */
  async listTopics(): Promise<Array<{ topicArn: string; name: string }>> {
    try {
      const command = new ListTopicsCommand({});
      const result = await snsClient.send(command);

      return result.Topics?.map(topic => ({
        topicArn: topic.TopicArn!,
        name: topic.TopicArn!.split(':').pop()!,
      })) || [];
    } catch (error) {
      console.error('SNS list topics error:', error);
      throw new Error(`Failed to list topics: ${error}`);
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(subscriptionData: SubscriptionData): Promise<{ subscriptionArn: string }> {
    try {
      const command = new SubscribeCommand({
        TopicArn: subscriptionData.topicArn,
        Protocol: subscriptionData.protocol,
        Endpoint: subscriptionData.endpoint,
      });

      const result = await snsClient.send(command);
      return { subscriptionArn: result.SubscriptionArn! };
    } catch (error) {
      console.error('SNS subscribe error:', error);
      throw new Error(`Failed to subscribe to topic: ${error}`);
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribe(subscriptionArn: string): Promise<void> {
    try {
      const command = new UnsubscribeCommand({
        SubscriptionArn: subscriptionArn,
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('SNS unsubscribe error:', error);
      throw new Error(`Failed to unsubscribe: ${error}`);
    }
  }

  /**
   * List subscriptions for topic
   */
  async listSubscriptions(topicArn: string): Promise<Array<{
    subscriptionArn: string;
    protocol: string;
    endpoint: string;
    owner: string;
  }>> {
    try {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: topicArn,
      });

      const result = await snsClient.send(command);
      return result.Subscriptions?.map(sub => ({
        subscriptionArn: sub.SubscriptionArn!,
        protocol: sub.Protocol!,
        endpoint: sub.Endpoint!,
        owner: sub.Owner!,
      })) || [];
    } catch (error) {
      console.error('SNS list subscriptions error:', error);
      throw new Error(`Failed to list subscriptions: ${error}`);
    }
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminderSMS(
    phoneNumber: string,
    appointmentData: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      clinicName: string;
    }
  ): Promise<{ messageId: string }> {
    const message = `Hi ${appointmentData.patientName}, this is a reminder for your appointment with Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime} at ${appointmentData.clinicName}. Please arrive 15 minutes early. Reply STOP to opt out.`;

    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send medication reminder SMS
   */
  async sendMedicationReminderSMS(
    phoneNumber: string,
    medicationData: {
      patientName: string;
      medicationName: string;
      dosage: string;
      timeToTake: string;
    }
  ): Promise<{ messageId: string }> {
    const message = `Hi ${medicationData.patientName}, it's time to take your ${medicationData.medicationName} (${medicationData.dosage}) at ${medicationData.timeToTake}. Reply STOP to opt out.`;

    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(
    topicArn: string,
    alertData: {
      patientName: string;
      alertType: string;
      location: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      timestamp: string;
    }
  ): Promise<{ messageId: string }> {
    const message = `EMERGENCY ALERT - ${alertData.severity}: ${alertData.alertType} for patient ${alertData.patientName} at ${alertData.location}. Timestamp: ${alertData.timestamp}`;

    return this.publishToTopic(
      topicArn,
      message,
      `Emergency Alert - ${alertData.severity}`,
      {
        severity: alertData.severity,
        alertType: alertData.alertType,
        patientName: alertData.patientName,
        location: alertData.location,
      }
    );
  }

  /**
   * Create Platform Application for Push Notifications
   */
  async createPlatformApplication(appData: PlatformApplicationData): Promise<{ platformApplicationArn: string }> {
    try {
      const command = new CreatePlatformApplicationCommand({
        Name: appData.name,
        Platform: appData.platform,
        Attributes: appData.attributes,
      });

      const result = await snsClient.send(command);
      return { platformApplicationArn: result.PlatformApplicationArn! };
    } catch (error) {
      console.error('SNS create platform application error:', error);
      throw new Error(`Failed to create platform application: ${error}`);
    }
  }

  /**
   * Delete Platform Application
   */
  async deletePlatformApplication(platformApplicationArn: string): Promise<void> {
    try {
      const command = new DeletePlatformApplicationCommand({
        PlatformApplicationArn: platformApplicationArn,
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('SNS delete platform application error:', error);
      throw new Error(`Failed to delete platform application: ${error}`);
    }
  }

  /**
   * List Platform Applications
   */
  async listPlatformApplications(): Promise<Array<{
    platformApplicationArn: string;
    platform: string;
    name: string;
  }>> {
    try {
      const command = new ListPlatformApplicationsCommand({});
      const result = await snsClient.send(command);

      return result.PlatformApplications?.map(app => ({
        platformApplicationArn: app.PlatformApplicationArn!,
        platform: app.Attributes?.Platform || '',
        name: app.Attributes?.Name || '',
      })) || [];
    } catch (error) {
      console.error('SNS list platform applications error:', error);
      throw new Error(`Failed to list platform applications: ${error}`);
    }
  }

  /**
   * Create Platform Endpoint (Register Device)
   */
  async createPlatformEndpoint(endpointData: PlatformEndpointData): Promise<{ endpointArn: string }> {
    try {
      const command = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: endpointData.platformApplicationArn,
        Token: endpointData.token,
        CustomUserData: endpointData.customUserData,
        Attributes: endpointData.attributes,
      });

      const result = await snsClient.send(command);
      return { endpointArn: result.EndpointArn! };
    } catch (error) {
      console.error('SNS create platform endpoint error:', error);
      throw new Error(`Failed to create platform endpoint: ${error}`);
    }
  }

  /**
   * Delete Platform Endpoint (Unregister Device)
   */
  async deletePlatformEndpoint(endpointArn: string): Promise<void> {
    try {
      const command = new DeleteEndpointCommand({
        EndpointArn: endpointArn,
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('SNS delete platform endpoint error:', error);
      throw new Error(`Failed to delete platform endpoint: ${error}`);
    }
  }

  /**
   * Get Platform Endpoint Attributes
   */
  async getEndpointAttributes(endpointArn: string): Promise<{
    token: string;
    enabled: boolean;
    customUserData?: string;
  }> {
    try {
      const command = new GetEndpointAttributesCommand({
        EndpointArn: endpointArn,
      });

      const result = await snsClient.send(command);
      return {
        token: result.Attributes?.Token || '',
        enabled: result.Attributes?.Enabled === 'true',
        customUserData: result.Attributes?.CustomUserData,
      };
    } catch (error) {
      console.error('SNS get endpoint attributes error:', error);
      throw new Error(`Failed to get endpoint attributes: ${error}`);
    }
  }

  /**
   * Update Platform Endpoint Attributes
   */
  async updateEndpointAttributes(
    endpointArn: string,
    attributes: {
      token?: string;
      enabled?: boolean;
      customUserData?: string;
    }
  ): Promise<void> {
    try {
      const command = new SetEndpointAttributesCommand({
        EndpointArn: endpointArn,
        Attributes: {
          ...(attributes.token && { Token: attributes.token }),
          ...(attributes.enabled !== undefined && { Enabled: String(attributes.enabled) }),
          ...(attributes.customUserData && { CustomUserData: attributes.customUserData }),
        },
      });

      await snsClient.send(command);
    } catch (error) {
      console.error('SNS update endpoint attributes error:', error);
      throw new Error(`Failed to update endpoint attributes: ${error}`);
    }
  }

  /**
   * Send Push Notification to Single Device
   */
  async sendPushNotification(
    endpointArn: string,
    payload: PushNotificationPayload,
    subject?: string
  ): Promise<{ messageId: string }> {
    try {
      // Format the message for different platforms
      const message = JSON.stringify(payload);

      const command = new PublishCommand({
        TargetArn: endpointArn,
        Message: message,
        Subject: subject,
        MessageStructure: 'json',
      });

      const result = await snsClient.send(command);
      return { messageId: result.MessageId! };
    } catch (error) {
      console.error('SNS send push notification error:', error);
      throw new Error(`Failed to send push notification: ${error}`);
    }
  }

  /**
   * Send Push Notification to Topic (Multiple Devices)
   */
  async sendPushNotificationToTopic(
    topicArn: string,
    payload: PushNotificationPayload,
    subject?: string
  ): Promise<{ messageId: string }> {
    try {
      const message = JSON.stringify(payload);

      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        Subject: subject,
        MessageStructure: 'json',
      });

      const result = await snsClient.send(command);
      return { messageId: result.MessageId! };
    } catch (error) {
      console.error('SNS send push notification to topic error:', error);
      throw new Error(`Failed to send push notification to topic: ${error}`);
    }
  }

  /**
   * List Endpoints for Platform Application
   */
  async listEndpointsByPlatformApplication(platformApplicationArn: string): Promise<Array<{
    endpointArn: string;
    enabled: boolean;
    token: string;
    customUserData?: string;
  }>> {
    try {
      const command = new ListEndpointsByPlatformApplicationCommand({
        PlatformApplicationArn: platformApplicationArn,
      });

      const result = await snsClient.send(command);
      return result.Endpoints?.map(endpoint => ({
        endpointArn: endpoint.EndpointArn!,
        enabled: endpoint.Attributes?.Enabled === 'true',
        token: endpoint.Attributes?.Token || '',
        customUserData: endpoint.Attributes?.CustomUserData,
      })) || [];
    } catch (error) {
      console.error('SNS list endpoints error:', error);
      throw new Error(`Failed to list endpoints: ${error}`);
    }
  }

  // Healthcare-specific push notification methods

  /**
   * Send Appointment Reminder Push Notification
   */
  async sendAppointmentReminderPush(
    endpointArn: string,
    appointmentData: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      clinicName: string;
    }
  ): Promise<{ messageId: string }> {
    const payload: PushNotificationPayload = {
      default: `Appointment reminder: ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}`,
      APNS: {
        aps: {
          alert: {
            title: 'Appointment Reminder',
            body: `Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}`,
          },
          badge: 1,
          sound: 'default',
          category: 'APPOINTMENT_REMINDER',
        },
        customData: {
          type: 'appointment_reminder',
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime,
          doctorName: appointmentData.doctorName,
          clinicName: appointmentData.clinicName,
        },
      },
      APNS_SANDBOX: {
        aps: {
          alert: {
            title: 'Appointment Reminder',
            body: `Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}`,
          },
          badge: 1,
          sound: 'default',
          category: 'APPOINTMENT_REMINDER',
        },
        customData: {
          type: 'appointment_reminder',
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime,
          doctorName: appointmentData.doctorName,
          clinicName: appointmentData.clinicName,
        },
      },
      FCM: {
        notification: {
          title: 'Appointment Reminder',
          body: `Dr. ${appointmentData.doctorName} on ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}`,
        },
        data: {
          type: 'appointment_reminder',
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime,
          doctorName: appointmentData.doctorName,
          clinicName: appointmentData.clinicName,
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_appointment',
            color: '#007bff',
            sound: 'default',
            channel_id: 'appointment_reminders',
          },
        },
      },
    };

    return this.sendPushNotification(endpointArn, payload, 'Appointment Reminder');
  }

  /**
   * Send Medication Reminder Push Notification
   */
  async sendMedicationReminderPush(
    endpointArn: string,
    medicationData: {
      patientName: string;
      medicationName: string;
      dosage: string;
      timeToTake: string;
    }
  ): Promise<{ messageId: string }> {
    const payload: PushNotificationPayload = {
      default: `Time to take your ${medicationData.medicationName} (${medicationData.dosage})`,
      APNS: {
        aps: {
          alert: {
            title: 'Medication Reminder',
            body: `Time to take ${medicationData.medicationName} (${medicationData.dosage})`,
          },
          badge: 1,
          sound: 'medication_alert.wav',
          category: 'MEDICATION_REMINDER',
        },
        customData: {
          type: 'medication_reminder',
          medicationName: medicationData.medicationName,
          dosage: medicationData.dosage,
          timeToTake: medicationData.timeToTake,
        },
      },
      APNS_SANDBOX: {
        aps: {
          alert: {
            title: 'Medication Reminder',
            body: `Time to take ${medicationData.medicationName} (${medicationData.dosage})`,
          },
          badge: 1,
          sound: 'medication_alert.wav',
          category: 'MEDICATION_REMINDER',
        },
        customData: {
          type: 'medication_reminder',
          medicationName: medicationData.medicationName,
          dosage: medicationData.dosage,
          timeToTake: medicationData.timeToTake,
        },
      },
      FCM: {
        notification: {
          title: 'Medication Reminder',
          body: `Time to take ${medicationData.medicationName} (${medicationData.dosage})`,
        },
        data: {
          type: 'medication_reminder',
          medicationName: medicationData.medicationName,
          dosage: medicationData.dosage,
          timeToTake: medicationData.timeToTake,
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_medication',
            color: '#28a745',
            sound: 'medication_alert',
            channel_id: 'medication_reminders',
          },
        },
      },
    };

    return this.sendPushNotification(endpointArn, payload, 'Medication Reminder');
  }

  /**
   * Send Critical Alert Push Notification
   */
  async sendCriticalAlertPush(
    endpointArn: string,
    alertData: {
      patientName: string;
      alertType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
    }
  ): Promise<{ messageId: string }> {
    const payload: PushNotificationPayload = {
      default: `CRITICAL ALERT: ${alertData.message}`,
      APNS: {
        aps: {
          alert: {
            title: `${alertData.severity} Alert`,
            body: alertData.message,
          },
          badge: 1,
          sound: 'critical_alert.wav',
          'content-available': 1,
          category: 'CRITICAL_ALERT',
        },
        customData: {
          type: 'critical_alert',
          alertType: alertData.alertType,
          severity: alertData.severity,
          patientName: alertData.patientName,
        },
      },
      APNS_SANDBOX: {
        aps: {
          alert: {
            title: `${alertData.severity} Alert`,
            body: alertData.message,
          },
          badge: 1,
          sound: 'critical_alert.wav',
          'content-available': 1,
          category: 'CRITICAL_ALERT',
        },
        customData: {
          type: 'critical_alert',
          alertType: alertData.alertType,
          severity: alertData.severity,
          patientName: alertData.patientName,
        },
      },
      FCM: {
        notification: {
          title: `${alertData.severity} Alert`,
          body: alertData.message,
        },
        data: {
          type: 'critical_alert',
          alertType: alertData.alertType,
          severity: alertData.severity,
          patientName: alertData.patientName,
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_alert',
            color: '#dc3545',
            sound: 'critical_alert',
            channel_id: 'critical_alerts',
          },
        },
      },
    };

    return this.sendPushNotification(endpointArn, payload, 'Critical Alert');
  }

  /**
   * Register iOS Device for Push Notifications
   */
  async registerIOSDevice(
    platformApplicationArn: string,
    deviceToken: string,
    userId: string
  ): Promise<{ endpointArn: string }> {
    return this.createPlatformEndpoint({
      platformApplicationArn,
      token: deviceToken,
      customUserData: JSON.stringify({ userId, platform: 'ios' }),
    });
  }

  /**
   * Register Android Device for Push Notifications
   */
  async registerAndroidDevice(
    platformApplicationArn: string,
    registrationToken: string,
    userId: string
  ): Promise<{ endpointArn: string }> {
    return this.createPlatformEndpoint({
      platformApplicationArn,
      token: registrationToken,
      customUserData: JSON.stringify({ userId, platform: 'android' }),
    });
  }

  /**
   * Update Device Token
   */
  async updateDeviceToken(endpointArn: string, newToken: string): Promise<void> {
    return this.updateEndpointAttributes(endpointArn, {
      token: newToken,
      enabled: true,
    });
  }

  /**
   * Disable Device Notifications
   */
  async disableDeviceNotifications(endpointArn: string): Promise<void> {
    return this.updateEndpointAttributes(endpointArn, {
      enabled: false,
    });
  }
}

export const snsService = new SNSService();