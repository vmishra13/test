import { HTTP } from '../../.././../core/constants';
import { setupEnv } from '../testConfig';
setupEnv();
import { modmedPatientsHandler } from '../../modmedPatientsHandler';
import { signInIOSHandler } from '../../signInIOSHandler';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000;

const TEST_USER = {
    "email": "ashah@tangocode.com",
    "password": "Tangocode1",
    "deviceId": "54B52CB7-CBD9-4BD0-A5A5-C5D1158345A0",
    "deviceToken": "sparrowgoose"
};

describe('Mobile Platform - Modmed Patients tests', () => {
    let token  = '';

    beforeEach(async (done) => {
        try {
            const event = {
                httpMethod: HTTP.POST,
                body: JSON.stringify(TEST_USER)
            };
            const signInCB = (error, response) => {
                if (response && response.statusCode && response.statusCode === 200) {
                    const parsedBody = JSON.parse(response.body);
                    token = parsedBody.token;
                }
                done();
            };
            await signInIOSHandler(event, {}, signInCB);
        } catch (error) {
            done();
        }
    });

    test('GET Patient Found request - valid user', async (done) => {
        const event = { 
            httpMethod: HTTP.GET,
            headers: { Authorization: JSON.stringify({ "token": token }) },
            queryStringParameters: { name: 'Jason', lastname: 'Goldberg', dob: '1987-06-29' }
        };
        const cb = (error, response) => {
            
            console.log('@@@ response ');
            console.log(response);
            

            expect(response.statusCode).toBe(200);
            done();
        };
        await modmedPatientsHandler(event, {}, cb);
    });

    // test.skip('staffHandler GET All Staff', async (done) => {
    //     const event = { 
    //         httpMethod: HTTP.GET,
    //         headers: { Authorization: JSON.stringify({ "token": token }) },
    //         pathParameters: {}
    //     };
    //     const cb = (error, response) => {
    //         expect(response.statusCode).toBe(200);
    //         done();
    //     };
    //     await staffHandler(event, {}, cb);
    // });

    // test.skip('staffHandler GET DoctorId Staff', async (done) => {
    //     const event = { 
    //         httpMethod: HTTP.GET,
    //         headers: { Authorization: JSON.stringify({ "token": token }) },
    //         queryStringParameters: { "doctorId" : "06c05223-ffe1-4f6f-92d8-45d781e03452" }
    //     };
    //     const cb = (error, response) => {
    //         expect(response.statusCode).toBe(200);
    //         done();
    //     };
    //     await staffHandler(event, {}, cb);
    // });
});
