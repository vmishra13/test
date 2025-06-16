import { findPatientAppointments, getLocation, getPractitioner } from './services'

export const getPatientAppointmentList = async (patientId: string): Promise<ModmedObject[]> => {
    try {
        const apptData: SearchAppointment = {
            patientId: patientId
        }
        const response = await findPatientAppointments(apptData);
        if (response != undefined && response.total > 0 && response.entry != undefined)  {
            for (let j=0; j < response.entry.length; j++) {
                let appointment = response.entry[j];
                if (appointment.resource.participant.length > 0) {
                    // Try to add location name
                    for (let i=0; i<appointment.resource.participant.length; i++) {
                        let participant = appointment.resource.participant[i]
                        let reference = participant.actor.reference
                        
                        if (reference.includes('Location')) {
                            let id = reference.substring(reference.lastIndexOf('/') + 1)
                            let location = await getLocation(id);
                            
                            if (location != undefined) {
                                appointment.resource["location"] = location;
                            }
                        }

                        if (reference.includes('Practitioner')) {
                            let id = reference.substring(reference.lastIndexOf('/') + 1)
                            let practitioner = await getPractitioner(id);

                            if (practitioner != undefined) {
                                appointment.resource["practitioner"] = practitioner;
                            }
                            
                        }
                    }
                }
            }
            return response.entry;
        } else {
            return []; 
        }    
    } catch (error) {
        console.log(error)
        throw error;
    }
}