exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            hasAdminPassword: !!process.env.ADMIN_PASSWORD,
            hasJwtSecret: !!process.env.JWT_SECRET,
            adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
            jwtSecretLength: process.env.JWT_SECRET?.length || 0
        })
    };
};