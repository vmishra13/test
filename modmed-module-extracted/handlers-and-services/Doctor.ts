import { v4 as uuidV4 } from 'uuid'
import { Doctor, DoctorModel, StaffModel, Staff } from '../core/models';
import { DOCTOR_ALREADY_EXIST, MISSING_DOCTOR_REQUIRED_PARMS, DOCTOR_NOT_FOUND } from '../core/errors';
import { toAdminFormat } from '../core/models/Doctor'
import { compareArray } from '../core/utils';

export const getAll = async (): Promise<DoctorAdmin[]> => {
    try {
        let doctors = await DoctorModel.scan().exec();
        
        return doctors.filter(doctor => doctor.isActive).sort((a,b) => a.order-b.order).map(val => toAdminFormat(val));;
    } catch (error) {
        throw error;
    }
};

export const search = async (modmedId: string): Promise<Doctor | null> => {
    try {
        let doctors: Doctor[] = await DoctorModel.query('staffType').eq('doctor').and().where("modmedId").eq(modmedId).exec();
        const activeDoctors = doctors.filter(doctor => doctor.isActive)
        
        if (activeDoctors.length == 1) {
            return doctors[0]
        }

        return null;
    } catch (error) {
        throw error;
    }
};

export const create = async (doctorInfo: any): Promise<Doctor> => {
    try {
        // validate doctor info.
        if (doctorInfo.firstName === '' || doctorInfo.lastName === '' || doctorInfo.phoneNumber === '' || doctorInfo.email === '' || doctorInfo.birthDay === '') {
            throw MISSING_DOCTOR_REQUIRED_PARMS;
        }
        // check no other doctor with same staffId
        let doctors: Doctor[] = await DoctorModel.query('staffType').eq('doctor').and().where('staffId').eq(doctorInfo.email).exec()
        const activeDoctors = doctors.filter(doctor => doctor.isActive)

        if (activeDoctors.length > 0) {
            throw DOCTOR_ALREADY_EXIST;
        }

        const newDoctor = await DoctorModel.create({
            id: uuidV4(),
            phoneNumber: getDoctorPhoneNumberFromString(doctorInfo.phoneNumber),
            preSurgicalFiles: [],
            tempPassword: true,
            modmedId: doctorInfo.modmedId,
            ticketTypes: [],
            docusign_user_id: '',
            name: {
                first: doctorInfo.firstName,
                middle: '',
                last: doctorInfo.lastName,
                title: ''
            },
            imageUrl: '',
            password: generateTempPassword(10),
            inquiryTypes: [],
            clinics: [],
            staffId: doctorInfo.email,
            order: 99,
            isActive: true
        })

        return newDoctor
    } catch (error) {
        throw error
    }

};

const getDoctorPhoneNumberFromString = (phoneNumber: string): DoctorPhoneNumber => {
    const clearRegex = new RegExp('[^\\d]', 'g');
    const cleanedNumber: string = phoneNumber.replace(clearRegex, '')
    let clearPhoneNumber: number = Number(cleanedNumber);

    return {
        display: phoneNumber,
        value: clearPhoneNumber,
        countryCode: 1
    };
};

const generateTempPassword = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

export const updateDoctor = async (doctorId: string, body:any):Promise<Doctor> => {
    try {
        if (!doctorId || !body){
            throw MISSING_DOCTOR_REQUIRED_PARMS;
        }
        //get de doctor and staff with the doctorId
        let doctor = await DoctorModel.query("staffType").eq("doctor").and().where("id").eq(doctorId).exec();
        let staff = await StaffModel.query("type").eq("doctor").and().where('doctorId').eq(doctorId).exec();
        if (!doctor[0] || !staff[0]) {
            throw DOCTOR_NOT_FOUND;
        }
        let currentDoctor:Doctor = doctor[0];
        let currentStaff:Staff = staff[0];
        body = JSON.parse(body);
        let calls = [];
        //compare the date recive with the current data if there are not changes return the current info
        if(!compareInfoUpdate(currentDoctor,currentStaff,body)){
            return currentDoctor;
        }
        //change the data of the current doctor for the new data recive
        currentDoctor.name.first = body.name.first;
        currentDoctor.name.middle = body.name.middle;
        currentDoctor.name.last = body.name.last;
        currentDoctor.name.title = body.name.title;
        currentDoctor.phoneNumber = getDoctorPhoneNumberFromString(body.phoneNumber.display);
        currentDoctor.imageUrl = body.imageUrl;
        currentDoctor.clinicIds = body.clinicIds;
        currentDoctor.inquiryTypeIds = body.inquiryTypeIds;
        calls.push(currentDoctor.save());
        
        //change the data of the current staff for the new data recive
        currentStaff.firstName = body.name.first;
        currentStaff.middlename = body.name.middle;
        currentStaff.lastName = body.name.last;
        currentStaff.title = body.name.title;
        currentStaff.phoneNumber = getDoctorPhoneNumberFromString(body.phoneNumber.display);
        currentStaff.imageUrl = body.imageUrl;
        currentStaff.about = body.about;
        calls.push(currentStaff.save());
        
        await Promise.all(calls);
        return body;
    } catch (error) {
        throw error
    }
}


export const compareInfoUpdate = (currentDoctor:Doctor, currentStaff:Staff, body:any):boolean =>{
    if(!currentDoctor || !currentStaff || !body){
        throw MISSING_DOCTOR_REQUIRED_PARMS;
    }
    //compare the data ,if a one is different return true and update the data
    if(
        body.name.first !== currentDoctor.name.first ||
        body.name.middle !== currentDoctor.name.middle ||
        body.name.last !== currentDoctor.name.last ||
        body.name.title !== currentDoctor.name.title ||
        body.phoneNumber.value !== currentDoctor.phoneNumber.value ||
        body.phoneNumber.countryCode !== currentDoctor.phoneNumber.countryCode ||
        body.phoneNumber.display !== currentDoctor.phoneNumber.display ||
        body.imageUrl !== currentDoctor.imageUrl ||
        body.about !== currentStaff.about ||
        !compareArray(currentDoctor.clinicIds, body.clinicIds) ||
        !compareArray(currentDoctor.inquiryTypeIds, body.inquiryTypeIds)
    ){
        return true;
    }
    return false;
}
