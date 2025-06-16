import moment from 'moment';
import { v4 as uuidV4 } from "uuid";
import { Ticket, TicketModel, Patient, Doctor } from '../core/models'
import { MODMED_APPOINTMENT_TYPE } from '../core/constants';
import { search as searchDoctor} from '../controllers/doctor'

export const createModmedAppointment = async (appointment: AppointmentResource, patient: Patient): Promise<void> => {
    try {
        const inquiryType = 'Schedule An Appointment'
        const inquirySubtype = getInquirySubType(appointment)
        const apptDate = moment(appointment.start);
        const day = moment(apptDate).format('dddd');
        const date = moment(apptDate).format('MMMM Do');
        const time = moment(apptDate).format('h:mm A');
        const unix = moment(apptDate).unix()
        const timezone = 'Mountain Time';
        const appointmentDate: AppointmentDate = { day, date, timezone, time, unix };

        let modmedDoctorId: string

        for (let i = 0; i < appointment.participant.length; i++) {
            const actorContainer = appointment.participant[i];

            if (actorContainer.actor.reference.includes('Practitioner')) {
                modmedDoctorId = actorContainer.actor.reference.substring(actorContainer.actor.reference.lastIndexOf('/') + 1)
            }
        }

        if (modmedDoctorId == undefined) {
            return
        }

        const doctor: Doctor = await searchDoctor(modmedDoctorId)

        if (doctor == null) {
            return
        }

        let existingApp: Ticket[] = await TicketModel.scan().where("modmedId").eq(appointment.id).exec();
        console.log("Existing Appointments")
        console.log(existingApp)

        if (existingApp.length > 0) {
            return
        }

        const newTicket = await TicketModel.create({
            id: uuidV4(),
            doctorId: doctor.id,
            email: patient.email,
            name: `${patient.firstname} ${patient.lastname}`,
            dob: patient.dateOfBirth,
            phone: patient.phoneNumber,
            ticketType: 5,
            date: moment().unix(),
            unread: true,
            archived: false,
            data: {
                date: appointmentDate,
                currentStatus: appointment.status,
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
            modmedId: appointment.id,
            patientId: patient.email
        });

        console.log("Ticket:")
        console.log(newTicket)

        return;
    } catch (error) {
        throw error;
    }
};

const getInquirySubType = (appointment: AppointmentResource): string => {
    let object = appointment.appointmentType.coding[0]

    if (object.code == MODMED_APPOINTMENT_TYPE.FOLLOW_UP) {
        return 'Follow-Up Appointment'
    }

    if (object.code == MODMED_APPOINTMENT_TYPE.MRI) {
        return 'MRI Review'
    }

    if (object.code == MODMED_APPOINTMENT_TYPE.IMAGE_REVIEW) {
        return 'X-Ray Review'
    }
    return 'New Patient'
}