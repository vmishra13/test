import { buildResponse, returnError } from './core/lib';
import { HTTP } from './core/constants';
import { INCORRECT_HTTP_METHOD, MISSING_APPOINTMENT_ARCHIVED } from './core/errors';
import { getPatientAppointmentList } from './core/modmed/appointments'
import { getPatient } from './core/modmed/patient'
import { INCORRECT_PARAMS } from './core/errors'

export async function modmedPatientsHandler(event: any, context: any, callback: (error: any, res: any) => any) {
    if (event.httpMethod && event.httpMethod === HTTP.GET) {
        try {
            if (event.queryStringParameters && event.queryStringParameters.name && event.queryStringParameters.lastname && event.queryStringParameters.dob) {
                let patientResponse = await getPatient(event.queryStringParameters.name, event.queryStringParameters.lastname, event.queryStringParameters.dob)
                
                callback(null, buildResponse(200, { patient: patientResponse }));
            } else {
                throw INCORRECT_PARAMS
            }
        } catch (error) {
            returnError(context, error, callback)
        }
    } else {
        returnError(context, INCORRECT_HTTP_METHOD, callback);
    }
}

export async function modmedAppointmentHandler(event: any, context: any, callback: (error: any, res: any) => any) {
    if (event.httpMethod && event.httpMethod === HTTP.GET) {
        try {
            if (event.queryStringParameters && event.queryStringParameters.patientId) {
                console.log('modmedAppointmentHandler PatientId:')
                console.log(event.queryStringParameters.patientId)
                const response = await getPatientAppointmentList(event.queryStringParameters.patientId)
                console.log("modmedAppointmentHandler response")
                console.log(response)
                callback(null, buildResponse(200, { appointments: response }))
            } else {
                callback(null, buildResponse(200, { appointments: [] }));
            }
        } catch (error) {
            console.log('modmedAppointmentHandler catch')
            returnError(context, error, callback)
        }
    } else {
        console.log('modmedAppointmentHandler else')
        returnError(context, INCORRECT_HTTP_METHOD, callback);
    }
}