import { modmedFullAuthURL, modmedId, modmedPassword, modmedKey, modmedAuthenticationData } from '../../shared/constants/modmed';
import axios from 'axios';

export const getAuthenticated = async () => {
    try {
        console.log("STARTING: getAuthenticated")
        const url = modmedFullAuthURL;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-api-key': modmedKey,
            'Cache-Control': 'no-cache'
        }
        let data = modmedAuthenticationData;
        data = data.replace('{username}', modmedId);
        data = data.replace('{password}', modmedPassword);
        const response = await axios.post<AuthenticationResponse>(url, data, { headers: headers });
        console.log("AUTH RESPONSE: ")
        console.log(response)

        return response.data || null

    } catch (error) {
        console.log('Error getAuthenticated: ', error.response.data);
        throw error;
    }
}