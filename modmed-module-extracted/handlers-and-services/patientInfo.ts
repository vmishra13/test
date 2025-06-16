import { PlanModel, InjuryModel, Injury, PatientInfo, PatientInfoModel, Patient, PatientModel, TicketModel, PatientNoteModel } from '../core/models';
import { getPatientInfo } from '../core/models/PatientInfo';
import { getPatient } from '../core/models/Patient';
import { v4 as uuidV4 } from 'uuid';
import moment from 'moment';
import PushNotificationManager from '../services/PushNotificationManager';
import { NOTIFICATION_MESSAGES, DIAGNOSIS_RESOURCE_ATTRS } from '../core/constants'
import { MISSING_PATIENT_INFO_NOTE, MISSING_PERSONAL_RESOURCES, INVALID_JSON_BODY, PATIENT_NOT_FOUND, NO_PATIENT_INFO_FOUND } from '../core/errors'
import { isValidJson, isValidProperty } from '../core/lib'
import { parsePhoneNumberToString, validateBody, decrypt, encrypt } from '../core/utils'
import { getPDFSignedURL } from './platform/s3FileManager'

export const get = async (id: string, doctorId?: string): Promise<PatientInfoWebFEDetail> => {
    try {
        const patientInfo = await getPatientInfo(id);

        if (patientInfo) {
            const parsedPatientInfo = await parsePatientInfoToDetailItem(patientInfo, doctorId);
            return parsedPatientInfo;
        }

        throw PATIENT_NOT_FOUND
        
    } catch (error) {
        console.log("ERROR at getPatientInfoById: ", error)
        throw error;
    }
};

export const search = async (doctorId: string, conciergeOnly: boolean): Promise<PatientInfoWebFEListItem[]> => {
    /* return only patients who ever had some ticket with the doctorId */
    try {
        const patientsScan = PatientModel.scan();

        if (conciergeOnly) {
            patientsScan.where("concierge").eq(true)
        }

        const patients = await patientsScan.exec();
        console.log("Patients")
        console.log(JSON.stringify(patients))
        let doctorsPatients: Patient[] = []
        const tickets = await TicketModel.query("doctorId").eq(doctorId).exec()

        for (let patient of patients) {
            const pTickets = tickets.filter(t => t.email === patient.email)
            patient.tickets = pTickets

            if (tickets.count > 0) {
                console.log("Patient")
                console.log(JSON.stringify(patient))
                
                doctorsPatients.push(patient)
            }
        }

        const patientInfoList: PatientInfoWebFEListItem[] = toPatientInfoListItems(doctorsPatients).sort((a, b) => {
            if (a.lastname < b.lastname) {
                return -1;
            }
            if (a.lastname > b.lastname) {
                return 1;
            }
            return 0;
        });

        return patientInfoList;
    } catch (error) {
        console.log("ERROR at search: ", error)
        throw error;
    }
};

export const getPatientInfoList = async (doctorId: string): Promise<PatientInfoWebFEListItem[]> => {
    return search(doctorId, false)
}

const parsePatientInfoToDetailItem = async (patientInfo: PatientInfo, doctorId?: string): Promise<PatientInfoWebFEDetail> => {
    try {
        const email = decrypt(patientInfo.email);
        const patient: Patient = await getPatient(email);
        const number = parsePhoneNumberToString(patient.phoneNumber);
        console.log("PatientInfo: ", patientInfo)
        console.log("Patient: ", patient)
        let injuries: Injury[] = []
        
        if (doctorId) {
            console.log("added doctor id: ", doctorId)
            injuries = await InjuryModel.query("patientInfoId").eq(patientInfo.email).and().where("doctorId").eq(doctorId).exec()
        } else {
            injuries = await InjuryModel.query("patientInfoId").eq(patientInfo.email).exec()
        }
        console.log("Injuries: ",injuries)

        const notes = await PatientNoteModel.query('patientInfoId').eq(patientInfo.email).exec()
        let plans = await PlanModel.query("patientInfoId").eq(patientInfo.email).exec()
        injuries.forEach((injury, index, array) => {
            injury.milestones.sort((a,b) => a.order-b.order)
            injury.milestones.forEach((milestone, mIndex, mArray) => {
                milestone.groups.sort((a,b) => a.order-b.order)
                milestone.groups.forEach((group, gIndex, gArray) => {
                    group.components.sort((a,b) => a.order-b.order)
                    group.components.map(async (c, cIndex, cArray) => {
                        if (c.typeId === 1 && c.title === 'Diagnosis & Plan' && c.visible) {
                            let planId = c.url.substring(c.url.lastIndexOf('/') + 1, c.url.lastIndexOf('.'));
                            c.url = await getPDFSignedURL(planId)
                            console.log("parsePatientInfoToDetailItem: ", c.url)
                            cArray[cIndex] = c
                        }
                    })
                    gArray[gIndex] = group
                })
                mArray[mIndex] = milestone

            })
            array[index] = injury
        })
        let info = {...patientInfo, injuries: injuries, plans: plans, docs: [], notes: notes, personalResources: []}
        
        if (patientInfo.hasOwnProperty('email')) {
            delete(patientInfo.email);
        }
        console.log("email deleted")

        const parsedPatientInfo: PatientInfoWebFEDetail = {
            id: patientInfo.email,
            name: `${patient.firstname} ${patient.lastname}`,
            fileNamePrefix: `${patient.lastname}_${patient.firstname}_`,
            number,
            dateOfBirth: patient.dateOfBirth,
            email,
            modmedId: patient.modmedId,
            patientInfo: info
        };
        
        console.log("Patient Info: ", parsedPatientInfo)
        return parsedPatientInfo;
    } catch (error) {
        console.log("ERROR at parsePatientInfoToDetailItem: ",error)
        throw error;
    }
};

//==========================================================================================

export const getConciergePatientInfoList = async (doctorId: string): Promise<ConciergePatientInfoWebFEListItem[]> => {
    try {
        const patientInfoList = await search(doctorId, true)

        // for each patient => get next appt. information from modmed
        let conciergePatientList: ConciergePatientInfoWebFEListItem[] = [];

        // dummy data for testing
        for (let i = 0; i < patientInfoList.length; i++) {
            let patient = patientInfoList[i];
            let conciergePatient: ConciergePatientInfoWebFEListItem = {
                id: patient.id,
                lastname: patient.lastname,
                firstname: patient.firstname,
                nextApptDate: '-',
                nextApptTime: '-',
                nextApptLocation: '-',
                number: patient.number,
                poc: 'Johnny'
            }
            conciergePatientList.push(conciergePatient);
        }
        return conciergePatientList;
    } catch (error) {
        console.log("ERROR at getConciergePatientInfoList: ", error)
        throw error;
    }
};

const toPatientInfoListItems = (patients: Patient[]) => {
    try {
        const patientInfoList: PatientInfoWebFEListItem[] = [];
        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            const number = parsePhoneNumberToString(patient.phoneNumber);
            const id = encrypt(patient.email);
            const patientInfoItem: PatientInfoWebFEListItem = {
                id,
                lastname: patient.lastname,
                firstname: patient.firstname,
                dateOfBirth: patient.dateOfBirth,
                number,
                email: patient.email,
                modmedId: patient.modmedId || null
            };
            patientInfoList.push(patientInfoItem);
        }
        return patientInfoList;
    } catch (error) {
        console.log("Error at toPatientInfoListItems: ", error)
        throw error
    }
    
};

export const updatePatientInfoNotes = async (patientInfoId: string, staffEmail: string, body: any): Promise<PatientInfoWebFEDetail> => {
    try {

        const patientInfo: PatientInfo = await getPatientInfo(patientInfoId);

        if (!patientInfo) throw NO_PATIENT_INFO_FOUND;

        let relatedTicket = ''
        if (body.hasOwnProperty('relatedTicket') && body.relatedTicket !== null && body.relatedTicket !== undefined) {
            relatedTicket = body.relatedTicket;
        }
        await PatientNoteModel.create({
            id: uuidV4(),
            staff: staffEmail,
            date: moment().unix(),
            content: body.note,
            relatedTicket: relatedTicket,
            patientInfoId: patientInfoId
        });

        const notes = await PatientNoteModel.query('patientInfoId').eq(patientInfoId).exec();

        patientInfo.notes = notes
        patientInfo.notes.sort((a, b) => { return b.date - a.date });

        const parsedPatientInfoDetailItem = await parsePatientInfoToDetailItem(patientInfo);

        return parsedPatientInfoDetailItem;
    } catch (error) {
        console.log("ERROR at updatePatientInfoNotes: ", error)
        throw error;
    }
};

export const updatePatientPersonalResources = async (patientInfoId: string, body: PatientInfoResourcesPutBody): Promise<PatientInfoWebFEDetail> => {
    try {
        const patientInfo: PatientInfo = await getPatientInfo(patientInfoId);
        patientInfo.personalResources = body.personalResources;
        const updatedPatientInfo = await PatientInfoModel.update(patientInfo);
        const parsedPatientInfoDetailItem: PatientInfoWebFEDetail = await parsePatientInfoToDetailItem(updatedPatientInfo);
        const notifManager = new PushNotificationManager();
        const email = decrypt(patientInfoId);
        await notifManager.triggerNotification(email, NOTIFICATION_MESSAGES.PERSONAL_RESOURCES_MODIFIED.title, NOTIFICATION_MESSAGES.PERSONAL_RESOURCES_MODIFIED.message);
        
        return parsedPatientInfoDetailItem;
    } catch (error) {
        console.log("ERROR at updatePatientPersonalResources: ", error)
        throw error;
    }
}

// TODO: Expand body validation for patient info as its constituent attributes become better defined.
export const validateNoteBody = (body: any) => {
    const parsedBody = validateBody(body, [{ fieldName: 'note', error: MISSING_PATIENT_INFO_NOTE }]);
    return parsedBody;
};

export const validateResourcesBody = (body: any): PatientInfoResourcesPutBody => {
    if (!isValidJson(body)) {
        throw ({ code: 400, message: INVALID_JSON_BODY });
    }
    const parsedBody = JSON.parse(body);
    if (!parsedBody.hasOwnProperty('personalResources')) {
        throw MISSING_PERSONAL_RESOURCES;
    }
    if (parsedBody.personalResources.length > 0) {
        const resources = parsedBody.personalResources;
        for (let i = 0; i < resources.length; i++) {
            const currentResource = resources[i];
            DIAGNOSIS_RESOURCE_ATTRS.forEach(attr => {
                if (!isValidProperty(currentResource[attr.fieldName])) {
                    throw attr.error;
                }
            })
        }
    }
    return parsedBody as PatientInfoResourcesPutBody;
};
