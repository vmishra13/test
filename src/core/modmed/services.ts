import axios from 'axios';
import { modmedFullFhirURL, modmedKey } from '../../shared/constants/modmed';
import { getAuthenticated } from './authentication'
enum AppointmentStatus {
    PENDING = 'pending',
    BOOKED = 'booked',
    CHECKED_IN = 'checked-in'
}

export const findPatient = async (patient: SearchPatient) => {
    try {
        console.log("STARTING: findPatient")
        console.log(patient)

        let params = {
            "family": patient.family,
            "given": patient.given,
            "birthdate": patient.birthdate
        }

        const fullUrl = getModMedURL("Patient", params)
        console.log("FULL URL: findPatient")
        console.log(fullUrl)

        const headers = await getHeaders()

        const response = await axios.get(fullUrl, { headers: headers });
        console.log("DATA: findPatient")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log('Error findPatient: ', error);
        throw error;
    }
}

export const findPatientAppointments = async (filters: SearchAppointment) => {
    try {
        console.log("STARTING: findPatientAppointments")
        console.log(filters)

        const headers = await getHeaders()
        let params = {
            patient: filters.patientId,
            status: `${AppointmentStatus.PENDING},${AppointmentStatus.CHECKED_IN},${AppointmentStatus.BOOKED}`
        }

        let fullUrl = getModMedURL("Appointment", params);
        console.log("FULL URL: findPatientAppointments")
        console.log(fullUrl)

        const response = await axios.get<SearchSet>(fullUrl, { headers: headers });
        console.log("DATA: findPatientAppointments")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log('Error findPatientAppointments - ', error);
        throw error;
    }
}

export const getLocation = async (id: string) => {
    try {
        console.log("STARTING: getLocation")
        console.log(id)

        const headers = await getHeaders()

        let fullUrl = getModMedURL(`Location/${id}`, {});
        console.log("FULL URL: getLocation")
        console.log(fullUrl)

        const response = await axios.get<ClinicLocation>(fullUrl, { headers: headers });
        console.log("DATA: getLocation")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log('Error finding location - ', error);
        throw error;
    }
}

export const getPractitioner = async (id: string) => {
    try {
        console.log("STARTING: getPractitioner")
        console.log(id)

        const headers = await getHeaders()
        let fullUrl = getModMedURL(`Practitioner/${id}`, {});
        console.log("FULL URL: getPractitioner")
        console.log(fullUrl)

        const response = await axios.get<Practitioner>(fullUrl, { headers: headers });
        console.log("DATA: getPractitioner")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log('Error finding Actor - ', error);
        throw error;
    }
}

export const getDocuments = async (id: string, category: string) => {
    try {
        console.log("STARTING: findPatientDocuments")
        console.log(id)

        let params = {
            "patient": id,
            "category": category
        }

        const fullUrl = getModMedURL("DocumentReference", params)
        console.log("FULL URL: getDocuments")
        console.log(fullUrl)

        const headers = await getHeaders()

        const response = await axios.get(fullUrl, { headers: headers });
        console.log("DATA: getDocuments")
        console.log(response.data)

        return response.data || null;

    } catch (error) {
        console.log("Error getDocuments ", error);
        throw error;
    }
}

export const readDocuments = async (id?: string, patientId?: string, patientRef?: string) => {
    try {
        console.log("STARTING: readDocuments")
        let params: any = {};
        if (id != null) {
            console.log("Search by document ID")
            console.log(id)
        } else if (patientId != null && patientRef == null) {
            console.log("Search by patient ID")
            console.log(patientId)
            params = {
                "patient": patientId
            }
        } else if (patientId == null && patientRef != null) {
            console.log("Search by patient Ref")
            console.log(patientRef)
            params = {
                "patient": patientRef
            }
        }

        let fullUrl;
        if (id != null) {
            var re = "|";
            var parsedDocumentId = id.replace(re, "%7C")
            fullUrl = getModMedURL(`DocumentReference/${parsedDocumentId}`, {})
        } else {
            fullUrl = getModMedURL("DocumentReference", params)
        }
        console.log("FULL URL: readDocuments")
        console.log(fullUrl)

        const headers = await getHeaders()

        const response = await axios.get(fullUrl, { headers: headers });
        console.log("Data: readDocuments")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log("Error readDocuments", error)
        throw error;
    }
}

export const searchDocuments = async (document: SearchDocuments) => {
    try {
        console.log("STARTING: searchDocuments")
        console.log(document)

        let params = {
            "date": document.date,
            "description": document.description,
            "identifier": document.identifier,
            "page": document.page,
            "patientId": document.patientId,
            "type": document.type
        }

        const fullUrl = getModMedURL("DocumentReference", params)
        console.log("FULL URL: searchDocument")
        console.log(fullUrl)

        const headers = await getHeaders()

        const response = await axios.get(fullUrl, { headers: headers });
        console.log("DATA: searchPatient")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log("Error searchDocument: ", error);
        throw error;
    }
}
export const getConditions = async (patientId: string) => {
    try {
        const headers = await getHeaders();
        let params = { patient: patientId };
        let fullUrl = getModMedURL('Condition', params);
        const response = await axios.get<ConditionSearchSet>(fullUrl, { headers: headers });
        return response.data || null;
    } catch (error) {
        console.log('Error searchingCondition - ', error);
        throw error;
    }
}

export const getMedications = async (patientId: string) => {
    try {
        console.log("STARTING: getMedications")
        console.log(patientId)

        const headers = await getHeaders();
        let params = { patient: patientId };
        let fullUrl = getModMedURL('MedicationRequest', params);
        
        console.log("FULL URL: getMedications")
        console.log(fullUrl)

        const response = await axios.get<MedicationSearchSet>(fullUrl, { headers: headers });
        
        console.log("DATA: getMedications")
        console.log(response.data)

        return response.data || null;
    } catch (error) {
        console.log('Error getMedications - ', error);
        throw error;
    }
}

export const getDocumentObject = async (documentId: string) => {
    try {
        var re = "|";
        var parsedDocumentId = documentId.replace(re, "%7C")
        const fullUrl = getModMedURL(`DocumentReference/${parsedDocumentId}`, {})
        console.log("FULL URL: getDocumentObject")
        console.log(fullUrl)

        const headers = await getHeaders();
        const response = await axios.get(fullUrl, { headers: headers });

        const documentUrl = response.data.content.attachment.url

        console.log("URL of the document: ")
        console.log(documentUrl)

        return documentUrl
    } catch (error) {
        console.log("Error getDocumentObject: ", error);
        throw error;
    }
}

const getHeaders = async () => {
    try {
        const authData: AuthenticationResponse = await getAuthenticated()

        console.log("ModMed Authentication succeeded")
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-api-key': modmedKey,
            'Cache-Control': 'no-cache',
            'Authorization': authData.token_type + ' ' + authData.access_token
        }
    } catch (error) {
        throw error;
    }
}

const getModMedURL = (path: string, params: Object) => {
    let urlParameters: string = path;
    let queryParams: string = ""

    for (const [key, value] of Object.entries(params)) {
        queryParams = queryParams.concat(`${key}=${value}&`);
    }

    queryParams = queryParams.substring(0, queryParams.length - 1);

    if (queryParams.length > 0) {
        urlParameters = urlParameters.concat(`?${queryParams}`)
    }

    return `${modmedFullFhirURL}${urlParameters}`;
}