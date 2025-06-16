import { findPatient } from './services'

export const getPatientsList = async (quantity: number, page: number): Promise<SearchPatientResult[]> => {
    const searchParms: SearchPatient = {
        given: '',
        family: '',
        birthdate: '',
        quantity: quantity,
        page: page
    }
    const response = await findPatient(searchParms);
    const patients: SearchPatientResult[] = [];
    if (response != undefined && response.hasOwnProperty("total") && response.total > 1)  {
        const patientsList: any[] = response.entry;
        patientsList.forEach(patient => {
            const patientResult: SearchPatientResult = {
                found: true,
                name: patient.resource.name[0].given[0] || '',
                lastname: patient.resource.name[0].family || '',
                dob: patient.resource.birthDate,
                modmedId: patient.resource.id
            }
            patients.push(patientResult);
        });
        return patients;
    } else {
        const result: SearchPatientResult[] = []
        return result; 
    }
}

export const getPatient = async (patientName: string, patientLastname: string, patientDOB: string): Promise<SearchPatientResult> => {
    const params: SearchPatient = {
        given: patientName,
        family: patientLastname,
        birthdate: patientDOB
    }
    const response = await findPatient(params);
    if (response.hasOwnProperty("total") && response.total === 1)  {
        const patient = response.entry[0].resource;
        const result: SearchPatientResult = {
            found: true,
            name: patient.name[0].given[0] || '',
            lastname: patient.name[0].family || '',
            dob: patient.birthDate,
            modmedId: patient.id
        }
        return result;
    } else {
        const result: SearchPatientResult = {
            found: false
        }
        return result;   
    }
}