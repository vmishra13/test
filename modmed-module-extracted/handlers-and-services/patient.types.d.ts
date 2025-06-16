declare type PatientInfo = {
    lastname: string
    firstname: string
    dateOfBirth: string
    number: object
    email: string
}

declare type PatientInfoWebFEDetail = {
    id: string;
    name: string;
    fileNamePrefix: string;
    number: string;
    dateOfBirth: string;
    email: string;
    modmedId: string;
    patientInfo: any;
};

declare type PatientInfoWebFEListItem = {
    id: string;
    lastname: string;
    firstname: string;
    dateOfBirth: string;
    number: string;
    email: string;
    modmedId?: string;
};

declare type ConciergePatientInfoWebFEListItem = {
    id: string;
    lastname: string;
    firstname: string;
    number: string;
    nextApptDate: string;
    nextApptTime: string;
    nextApptLocation: string;
    poc: string;
}
