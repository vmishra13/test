import { buildResponse, returnError } from './core/lib';
import { HTTP } from './core/constants';
import { INCORRECT_HTTP_METHOD, INCORRECT_PARAMS } from './core/errors';
import { getPatient } from './core/models/Patient';
import { getPatientAppointmentList } from './core/modmed/appointments'
import { createModmedAppointment } from './services/modmed'

export async function patientHandler(event: any, context: any, callback: (error: any, res: any) => any) {
    try {
        if (event.httpMethod && event.httpMethod === HTTP.GET) {
            if (event.pathParams && event.queryStringParameters.email && event.queryStringParameters.modmedId) {
                throw INCORRECT_PARAMS
            }

            let patient = await getPatient(event.queryStringParameters.email)
            let appointments: ModmedObject[] = await getPatientAppointmentList(event.queryStringParameters.modmedId)
            let count: number = 0

            for (let i = 0; i < appointments.length; i++) {
                const modmedAppointment = appointments[i];
                await createModmedAppointment(modmedAppointment.resource, patient)
                count++
            }

            callback(null, buildResponse(200, { created: count }));
        } else {
            throw INCORRECT_HTTP_METHOD;
        }
    } catch (error) {
        returnError(context, error, callback);
    }
}
