
import { Session, PatientModel, PatientInfoModel } from '../../../core/models';
import { getPatient } from '../../../core/models/Patient';
import SignUpBodyIOS from '../../../core/models/SignUpBodyIOS';
import { isValidProperty, trimObject } from '../../../core/lib';
import { deviceCheck } from './deviceCheck';
import { PATIENT_STATUS, SIGN_UP_ATTRS, PLATFORM } from '../../../core/constants';
import { encryptPassword, createSessionToken, validateBody, encrypt } from '../../../core/utils';
import { MISSING_DEVICE_TOKEN, DUPLICATE_EMAIL, MISSING_PHONE_NUMBER } from '../../../core/errors';

export const signUpIOS = async (body: SignUpBodyIOS) => {
    try {
        await deviceCheck(body.deviceToken);
        const createdPatient = await createPatient(body);
        return createdPatient;
    } catch (error) {
        throw error;
    }
};

export const validateBodyIOS = (body: any): SignUpBodyIOS => {
    const parsedBody = validateBody(body, SIGN_UP_ATTRS);
    if (!isValidProperty(parsedBody.deviceToken)) {
        throw MISSING_DEVICE_TOKEN;
    }
    if (!parsedBody.hasOwnProperty('phoneNumber')
        || !parsedBody.phoneNumber.hasOwnProperty('countryCode')
        || !parsedBody.phoneNumber.hasOwnProperty('number')
        || parsedBody.phoneNumber.countryCode === undefined
        || parsedBody.phoneNumber.number === undefined) {
        throw MISSING_PHONE_NUMBER;
    }
    const countryCode = Number(parsedBody.phoneNumber.countryCode);
    const number = Number(parsedBody.phoneNumber.number);
    if (isNaN(countryCode) || isNaN(number)) {
        throw MISSING_PHONE_NUMBER;
    }
    parsedBody.phoneNumber.countryCode = countryCode;
    parsedBody.phoneNumber.number = number;
    const phoneNumber: PhoneNumber = parsedBody.phoneNumber;
    trimObject(parsedBody);
    return new SignUpBodyIOS(
        parsedBody.firstname,
        parsedBody.lastname,
        parsedBody.email,
        encryptPassword(parsedBody.password),
        parsedBody.dateOfBirth,
        parsedBody.modmedId,
        parsedBody.deviceId,
        PATIENT_STATUS.ACTIVE,
        phoneNumber,
        parsedBody.deviceToken,
    );
};

const createPatient = async (body: SignUpBodyIOS): Promise<Session> => {
    try {
        await checkPatientDuplicate(body.email);
        const patient = await PatientModel.create({
            email: body.email,
            phoneNumber: body.phoneNumber,
            lastname: body.lastname,
            password: body.password,
            notificationDevices: body.notificationDevices,
            deviceId: body.deviceId,
            currentStatus: body.currentStatus,
            firstname: body.firstname,
            createdAt: body.createdAt,
            dateOfBirth: body.dateOfBirth,
            modmedId: body.modmedId,
            type: 'Patient',
            searchParams: `${body.firstname} ${body.lastname}`
        });
        const session = await createSessionToken(patient.email, PLATFORM.MOBILE);
        await createNewPatientInfo(patient.email);
        return session;
    } catch (error) {
        throw error;
    }
};

const checkPatientDuplicate = async (email: string): Promise<void> => {
    try {
        const patient = await getPatient(email);

        if (patient !== null) {
            throw DUPLICATE_EMAIL;
        }

        return
    } catch (error) {
        throw error;
    }
};

const createNewPatientInfo = async (email: string): Promise<void> => {
    try {
        const encryptedEmail = encrypt(email);
        await PatientInfoModel.create({
            email: encryptedEmail
        });
    } catch (error) {
        throw error;
    }
};
