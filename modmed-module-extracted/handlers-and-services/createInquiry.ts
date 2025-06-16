import moment from 'moment';
import { v4 as uuidV4 } from "uuid";
import { Patient, TicketModel, Ticket } from '../../core/models'
import { getDoctor } from '../../core/models/Doctor'
import { validateBody } from '../../core/utils';
import { NEW_APPOINTMENT_TICKET_VALIDATION_ATTRS, NEW_TICKET_VALIDATION_ATTRS, INQUIRY_STATUS, TICKET_TYPES, INQUIRY_TYPES } from '../../core/constants';
import { INQUIRY_TYPE_NOT_SUPPORTED_BY_DOCTOR } from '../../core/errors';
import { getPatient } from '../../core/models/Patient';

export const createInquiry = async (body: InquiryPostBody, patient: Patient): Promise<Ticket> => {
    try {
        const { inquiryType, inquirySubtype } = await getDoctorMatchingInquiryType(body.doctorId, body.inquiryType, body.inquirySubtype);
        const inquiry = await TicketModel.create({
            id: uuidV4(),
            doctorId: body.doctorId,
            email: patient.email,
            name: `${patient.firstname} ${patient.lastname}`,
            dob: patient.dateOfBirth,
            phone: patient.phoneNumber,
            ticketType: TICKET_TYPES.INQUIRY,
            date: moment().unix(),
            unread: true,
            archived: false,
            data: {
                currentStatus: INQUIRY_STATUS.PENDING,
                info: body.info,
                inquiryType,
                inquirySubtype,
                previousAttemptDates: [],
                relatedTickets: [],
                files: {
                    title: '',
                    list: []
                },
                forms: {
                    title: '',
                    list: []
                },
                updateDate: moment().unix(),
                checkedIn: false
            },
            resources: []
        });

        return inquiry
    } catch (error) {
        console.log("createInquiry error: ", error)
        throw error;
    }
};

export const createInquiryWeb = async (body: InquiryPostBodyWeb, doctorId: string): Promise<void> => {
    try {
        const patient = await getPatient(body.email)
        const { inquiryType, inquirySubtype } = await getDoctorMatchingInquiryType(doctorId, body.inquiryType, body.inquirySubtype);
        await TicketModel.create({
            id: uuidV4(),
            doctorId: doctorId,
            email: patient.email,
            name: patient.firstname,
            dob: patient.dateOfBirth,
            phone: patient.phoneNumber,
            ticketType: TICKET_TYPES.INQUIRY,
            date: moment().unix(),
            unread: true,
            archived: false,
            data: {
                currentStatus: INQUIRY_STATUS.PENDING,
                info: body.info,
                inquiryType,
                inquirySubtype,
                previousAttemptDates: [],
                relatedTickets: [],
                files: {
                    title: '',
                    list: []
                },
                forms: {
                    title: '',
                    list: []
                },
                updateDate: moment().unix(),
                checkedIn: false
            },
            resources: []
        });

        return;
    } catch (error) {
        console.log("createInquiry error: ", error)
        throw error;
    }
};

export const createModmedAppointment = async (doctorId: string, body: ModmedAppointmentPostBody, patient: Patient): Promise<void> => {
    try {
        const { inquiryType, inquirySubtype } = await getDoctorMatchingInquiryType(doctorId, INQUIRY_TYPES.APPOINTMENT, "New Patient");
        const apptDate = moment(body.date);
        const day = moment(apptDate).format('dddd');
        const date = moment(apptDate).format('MMMM Do');
        const time = moment(apptDate).format('h:mm A');
        const unix = moment(apptDate).unix()
        const timezone = 'Mountain Time';
        const appointmentDate: AppointmentDate = { day, date, timezone, time, unix };

        let result = await TicketModel.scan('modmedId').eq(body.id).exec()

        if (result.length > 0) {
            return
        }

        await TicketModel.create({
            id: uuidV4(),
            doctorId: doctorId,
            email: patient.email,
            name: `${patient.firstname} ${patient.lastname}`,
            dob: patient.dateOfBirth,
            phone: patient.phoneNumber,
            ticketType: TICKET_TYPES.MODMED_APPOINTMENT,
            date: moment().unix(),
            unread: true,
            archived: false,
            data: {
                date: appointmentDate,
                currentStatus: INQUIRY_STATUS.PENDING,
                info: "",
                inquiryType,
                inquirySubtype,
                previousAttemptDates: [],
                relatedTickets: [],
                files: {
                    title: '',
                    list: []
                },
                forms: {
                    title: '',
                    list: []
                },
                updateDate: moment().unix(),
                checkedIn: false
            },
            resources: [],
            modmedId: body.id
        });

        return;
    } catch (error) {
        throw error;
    }
};

const getDoctorMatchingInquiryType = async (doctorId: string, inquiryId: string, inquirySubtype: string): Promise<{ inquiryType: string, inquirySubtype: string }> => {
    try {
        const doctor = await getDoctor(doctorId);

        for (const type of doctor.inquiryTypes) {
            if (type.id === inquiryId) {
                for (let j = 0; j < type.subTypes.length; j++) {
                    const subtype = type.subTypes[j];
                    if (subtype === inquirySubtype) {
                        return { inquiryType: type.name, inquirySubtype: subtype };
                    }
                }
                throw INQUIRY_TYPE_NOT_SUPPORTED_BY_DOCTOR;
            }
        }

        throw INQUIRY_TYPE_NOT_SUPPORTED_BY_DOCTOR;
    } catch (error) {
        throw error;
    }
};

export const validateNewInquiry = (body: any): InquiryPostBody => {
    const parsedBody = validateBody(body, NEW_TICKET_VALIDATION_ATTRS);
    return parsedBody as InquiryPostBody;
};

export const validateNewInquiryWeb = (body: any): InquiryPostBodyWeb => {
    const parsedBody = validateBody(body, NEW_APPOINTMENT_TICKET_VALIDATION_ATTRS);
    return parsedBody as InquiryPostBodyWeb;
};