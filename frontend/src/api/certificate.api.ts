import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api/";

axios.defaults.withCredentials = true;

export interface IssuePayload {
  file: File;
  ownerName: string;
  study: string;
  signature: string;
  issuerAddress: string;
}

export interface RevokePayload {
  target_tx_hash: string;
  signature: string;
  issuerAddress: string;
  reason: string;
}

export const CertificateAPI = {
  issue: async (payload: IssuePayload) => {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("ownerName", payload.ownerName);
    formData.append("study", payload.study);
    formData.append("signature", payload.signature);
    formData.append("issuerAddress", payload.issuerAddress);

    console.log("Issuing certificate with payload:", payload);
    console.log("Issuing certificate to: ", BACKEND_URL + "certificate/upload");

    const res = await axios.post(
      BACKEND_URL + "certificate/upload",
      formData
    );

    return res.data;
  },

  revoke: async (payload: RevokePayload) => {
    const res = await axios.post(
      BACKEND_URL + "certificate/revoke",
      payload
    );

    return res.data;
  },
  
  async list() {
    const res = await axios.get(BACKEND_URL + "certificate/list");
    return res.data;
  },

  async getById(id: string) {
    const { data } = await axios.get(BACKEND_URL + `certificate/${id}`);
    return data;
  },

  async download(fileName: string) {
    const res = await axios.get(BACKEND_URL + `certificate/download/${fileName}`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
