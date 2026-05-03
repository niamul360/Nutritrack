export const fetch = (...args: [input: RequestInfo | URL, init?: RequestInit]) => typeof window !== 'undefined' ? window.fetch(...args) : Promise.reject("Fetch stub");
export default fetch;
export const initializeApp = () => ({});
export const credential = {
  cert: () => ({})
};
export const getFirestore = () => ({});
export const getAuth = () => ({});
