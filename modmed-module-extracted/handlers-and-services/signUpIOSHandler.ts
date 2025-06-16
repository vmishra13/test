import SignUpBodyIOS from './core/models/SignUpBodyIOS';
import { buildResponse, returnError } from './core/lib';
import { HTTP } from './core/constants';
import { INCORRECT_HTTP_METHOD } from './core/errors';
import { signUpIOS, validateBodyIOS } from './controllers/security/iOS/signUpIOS';
import { getPatientAppointmentList } from './core/modmed/appointments'
import { createModmedAppointment } from './controllers/platform/createInquiry';
import { getPatient } from './core/models/Patient';

export async function signUpIOSHandler(event: any, context: any, callback: (error: any, res: any) => any) {
    if (event.httpMethod && event.httpMethod === HTTP.POST) {
        try {
            const signUpBody: SignUpBodyIOS = validateBodyIOS(event.body);
            const result = await signUpIOS(signUpBody);

            if (signUpBody != undefined && signUpBody.modmedId != undefined) {
                const patient = await getPatient(signUpBody.email);
                
                let appointments = await getPatientAppointmentList(signUpBody.modmedId)
                let body = getBody(appointments[0])
                console.log("body:")
                console.log(body)
                await createModmedAppointment(body.doctorId, body, patient)
            }

            callback(null, buildResponse(200, result));
        } catch (error) {
            returnError(context, error, callback);
        }
    } else {
        returnError(context, INCORRECT_HTTP_METHOD, callback);
    }
}

function getBody(modmedAppointment: any): ModmedAppointmentPostBody {
    let body: ModmedAppointmentPostBody = {
        doctorId: "0eac012c-a049-48bf-bdf8-28a158af5ce4",
        date: modmedAppointment.resource.start,
        id: modmedAppointment.resource.id
    }

    return body
}