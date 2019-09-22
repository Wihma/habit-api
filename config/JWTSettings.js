const fromHeaderOrQueryString = (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

module.exports = {
    testSettings: {
        secret: process.env.JWT_SECRET,
        getToken: fromHeaderOrQueryString
    },
    unlessPaths: {
        path: [
            '/api/test',
            { url: '/api/test', methods: ['GET', 'POST'] }
        ],
        path: [
            '/api/user/login',
            { url: '/api/user/login', methods: ['GET', 'POST'] }
        ]
    }
}