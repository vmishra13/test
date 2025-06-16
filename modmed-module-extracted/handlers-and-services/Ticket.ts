import * as dynamoose from 'dynamoose';
import { Document } from "dynamoose/dist/Document";
import { globalConst } from '../dynamoDb/appVariables';
import { TICKET_TYPES, INQUIRY_STATUS } from '../constants'
import { Doctor, getDoctor } from './Doctor'
import { TimeZoneSchema } from './Clinic'

export class Ticket extends Document {
    patientId: string
    id: string
    doctorId: string
    email: string
    name: string
    dob: string
    phone: any
    ticketType: number
    date: number
    unread: boolean
    archived: boolean
    data: TicketData
    resources: any[]
    laterality: string
    final: boolean
    modmedId: string
    deleted: boolean
}

const PhoneNumberSchema = new dynamoose.Schema({
    countryCode: Number,
    number: Number
})

const ListObjectSchema = new dynamoose.Schema({
    id: String,
        name: String,
        message: String,
        isComplete: Boolean,
        iconName: String,
        templateId: String,
        envelopeId: String,
        formType: String
})

const ListSchema = new dynamoose.Schema({
    title: String,
    message1: String,
    message2: String,
    list: {
        type: Array,
        schema: [ListObjectSchema]
    }
})

const DateSchema = new dynamoose.Schema({
    day: String,
    date: String,
    timezone: String,
    time: String,
    unix: Number
})

const StatusSchema = new dynamoose.Schema({
    name: String,
    title: String,
    actionTitle: String,
    color: String
})

const PdfSchema = new dynamoose.Schema({
    title: String,
    order: Number,
    url: String
})

const DataSchema = new dynamoose.Schema({
    inquirySubtype: String,
    inquiryType: String,
    inquiryId: String,
    checkedIn: Boolean,
    locationId: String,
    location: {
        type: Object,
        schema: {
            name: String,
            address: String,
            image: String,
            timeZone: {
                type: Object,
                schema: TimeZoneSchema
            },
            sendForms: Boolean,
            showLocation: Boolean
        }
    },
    planId: { type: String, required: false },
    completed: Boolean,
    tbd: Boolean,
    currentStatus: String,
    type: String,
    info: String,
    previousAttemptDates: {
        type: Array,
        schema: [String]
    },
    relatedTickets: {
        type: Array,
        schema: [String]
    },
    date: {
        type: Object,
        schema: DateSchema
    },
    files: {
        type: Object,
        schema: ListSchema
    },
    forms: {
        type: Object,
        schema: ListSchema
    },
    status: {
        type: Object,
        schema: StatusSchema
    },
    updateDate: Number,
    appointmentId: String,
    joint: String,
    laterality: String,
    pdfs: {
        type: Array,
        schema: [PdfSchema]
    }
})

const ResourceObject = new dynamoose.Schema({
    title: String,
    url: String,
    order: Number,
    type: Number
})
const Resource = new dynamoose.Schema({
    title: String,
    components: {
        type: Array,
        schema: [ResourceObject]
    }
})

const TicketSchema = new dynamoose.Schema({
    doctorId: {
        hashKey: true,
        type: String
    },
    id: {
        rangeKey: true,
        type: String,
        index: true
    },
    email: {
        type: String,
        index: true
    },
    name: String,
    dob: String,
    phone: PhoneNumberSchema,
    ticketType: Number,
    date: Number,
    unread: Boolean,
    archived: Boolean,
    data: {
        type: Object,
        schema: DataSchema
    },
    resources: {
        type: Array,
        schema: [Resource]
    },
    laterality: String,
    final: Boolean,
    modmedId: String,
    deleted: {
        type: Boolean,
        default: false
    }
});

export const TicketModel = dynamoose.model<Ticket>(`${globalConst.stage}_ticket`, TicketSchema, {
    create: true,
    update: false,
    throughput: 'ON_DEMAND'
});

export const parseTickets = async (tickets: Ticket[]): Promise<TicketListItemMobileFE[]> => {
    try {
        const parsedTickets: TicketListItemMobileFE[] = [];

        for (const ticket of tickets) {
            const doctor = await getDoctor(ticket.doctorId);
            if (doctor != null) {
                let parsedTicket: TicketListItemMobileFE;
                switch (ticket.ticketType) {
                    case TICKET_TYPES.INQUIRY:
                        parsedTicket = parseTicketToInquiryFE(ticket, doctor);
                        break;
                    case TICKET_TYPES.APPOINTMENT:
                        parsedTicket = parseTicketToAppointmentFE(ticket, doctor);
                        break;
                    case TICKET_TYPES.IMAGE_REVIEW:
                        parsedTicket = parseTicketToImageReviewFE(ticket, doctor);
                        break;
                    case TICKET_TYPES.SCHEDULED_SURGERIES:
                        parsedTicket = parseTicketToScheduledSurgeryFE(ticket, doctor);
                        break;
                    case TICKET_TYPES.NON_OPERATIVE:
                        parsedTicket = parseTicketToNonOperativeFE(ticket, doctor);
                        break;
                    case TICKET_TYPES.MODMED_APPOINTMENT:
                        parsedTicket = parseTicketToAppointmentFE(ticket, doctor);
                        break;
                    default:
                        console.log('@@@@@@@@@@@ Patient has unsupported ticket type: ', ticket);
                        break;
                }
                if (parsedTicket != null) {
                    parsedTickets.push(parsedTicket);
                }
            }
        }

        return parsedTickets;
    } catch (error) {
        throw error;
    }
};

const parseTicketToInquiryFE = (ticket: Ticket, doctor: Doctor): TicketListItemMobileFE => {
    let parsedTicket: TicketListItemMobileFE;
    switch (ticket.data.currentStatus) {
        case INQUIRY_STATUS.PENDING:
            parsedTicket = {
                ...ticket,
                imageUrl: null,
                iconName: 'HomeInquirySentIcon',
                header1: ticket.data.inquiryType,
                header2: `${doctor.name.first} ${doctor.name.middle} ${doctor.name.last}, ${doctor.name.title}`,
                message: 'Your inquiry was sent, please allow 24 business hours for our staff to reach out to you.',
                hasCallToAction: false,
                callToActionMessage: null,
                callToActionLabel: null,
                callToActionValue: null,
                data: null
            };
            break;
        case INQUIRY_STATUS.FAILED_TO_CONTACT:
        case INQUIRY_STATUS.CLOSE:
            parsedTicket = {
                ...ticket,
                imageUrl: null,
                iconName: 'HomeContactIcon',
                header1: ticket.data.inquiryType,
                header2: `${doctor.name.first} ${doctor.name.middle} ${doctor.name.last}, ${doctor.name.title}`,
                message: 'Our team has reached out to you by phone without success, so we\'ve sent you an email. Please feel welcome to email us back or call the office at (970)-479-5806.',
                hasCallToAction: true,
                callToActionMessage: 'Call us at ',
                callToActionLabel: doctor.phoneNumber.display,
                callToActionValue: doctor.phoneNumber.value,
                data: null
            };
            break;
        default:
            break;
    }
    return parsedTicket;
};

const parseTicketToAppointmentFE = (ticket: Ticket, doctor: Doctor): TicketListItemMobileFE => {
    let parsedTicket: TicketListItemMobileFE = {
        ...ticket,
        imageUrl: doctor.imageUrl,
        iconName: null,
        header1: 'You have an upcoming appointment',
        header2: `with ${doctor.name.first} ${doctor.name.middle} ${doctor.name.last}, ${doctor.name.title}`,
        message: null,
        hasCallToAction: false,
        callToActionMessage: null,
        callToActionLabel: null,
        callToActionValue: null,
        data: ticket.data
    };
    return parsedTicket;
};

const parseTicketToImageReviewFE = (ticket: Ticket, doctor: Doctor): TicketListItemMobileFE => {
    const data: TicketListItemData = { date: null, status: ticket.data.status };
    let parsedTicket: TicketListItemMobileFE = {
        ...ticket,
        imageUrl: doctor.imageUrl,
        iconName: null,
        header1: 'You have a pending request for an',
        header2: `${ticket.data.type} with ${doctor.name.first} ${doctor.name.middle} ${doctor.name.last}, ${doctor.name.title}`,
        message: null,
        hasCallToAction: false,
        callToActionMessage: null,
        callToActionLabel: null,
        callToActionValue: null,
        data
    };
    return parsedTicket;
};

const parseTicketToScheduledSurgeryFE = (ticket: Ticket, doctor: Doctor): TicketListItemMobileFE => {
    let parsedTicket: TicketListItemMobileFE = {
        ...ticket,
        imageUrl: doctor.imageUrl,
        iconName: null,
        header1: 'You have an upcoming surgery',
        header2: `with ${doctor.name.first} ${doctor.name.middle} ${doctor.name.last}, ${doctor.name.title}. Your check-in time will be provided to you 1 business day prior to surgery.`,
        message: null,
        hasCallToAction: false,
        callToActionMessage: null,
        callToActionLabel: null,
        callToActionValue: null,
        data: ticket.data
    };
    return parsedTicket;
};

const parseTicketToNonOperativeFE = (ticket: Ticket, doctor: Doctor): TicketListItemMobileFE => {
    let parsedTicket: TicketListItemMobileFE = {
        ...ticket,
        imageUrl: doctor.imageUrl,
        iconName: null,
        header1: '',
        header2: '',
        message: null,
        hasCallToAction: false,
        callToActionMessage: null,
        callToActionLabel: null,
        callToActionValue: null,
        data: ticket.data
    };
    return parsedTicket;
};

export async function getTicket(id: string): Promise<Ticket|null> {
    try {
        const result = await TicketModel.scan('id').eq(id).exec()

        if (result.count === 1) {
            return result[0]
        }

        return null
    } catch (error) {
        return null        
    }
}