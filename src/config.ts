const config = {
    apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app/api'),
    wsUrl: import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app'),
};

export default config;
