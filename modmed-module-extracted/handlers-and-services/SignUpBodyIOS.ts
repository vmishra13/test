import moment from 'moment';
import { Patient } from '.';
import { PATIENT_STATUS } from '../constants';


export default class SignUpBodyIOS {
    public deviceToken: string;
    public email: string;
    public password: string;
    public createdAt: number;
    public firstname: string;
    public lastname: string;
    public currentStatus: PATIENT_STATUS;
    public deviceId: string[];
    public phoneNumber: PhoneNumber;
    public dateOfBirth: string;
    public modmedId: string;
    public homeData: HomeData;
    public notificationDevices: string[];
    public tickets: string[];

    public constructor(firstname: string, lastname: string, email: string, password: string, dob: string, modmedId: string, deviceId: string, currentStatus: PATIENT_STATUS, phoneNumber: PhoneNumber, deviceToken: string) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
        this.dateOfBirth = dob;
        this.modmedId = modmedId;
        this.deviceId = [deviceId];
        this.currentStatus = currentStatus;
        this.phoneNumber = phoneNumber;
        this.createdAt = moment().unix();
        this.deviceToken = deviceToken;
        this.notificationDevices = []
        this.tickets = [];
    }
}