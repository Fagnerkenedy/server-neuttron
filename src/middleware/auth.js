const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')
const { defineAbility } = require('@casl/ability');
const mysql = require('mysql2/promise');
const dbConfig = require('../database/index');
const orgId = 'org12759844'

const auth = (req, res, next) => {
    const autHeader = req.headers.authorization

    if(!autHeader)
        return res.status(401).send({ error: 'No token provided!' })
    
    const parts = autHeader.split(' ')

    if(!parts.lenght === 2)
        return res.status(401).send({ error: 'Token error!' })

    const [ scheme, token ] = parts

    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error: 'Token malformatted!' })

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) return res.status(401).send({ error: 'Token invalid or expired' })
        req.organization_id = decoded.organization_id
        req.id = decoded.userId
        return next()
    })
}

const getPermissionsForUser = async (user, org) => {
    const connection = await mysql.createConnection({ ...dbConfig, database: `${org}` });
    const [permissions] = await connection.execute(
        `SELECT 
        permissions.action as action, 
        permissions.subject as subject,
        users.id as idUser,
        modulos_relacionados.related_id as idPerfil,
        profiles_permissions.id_permission as idPermission
        FROM users
        JOIN modulos_relacionados on modulos_relacionados.module_id = ?
        JOIN profiles_permissions on profiles_permissions.id_profile = modulos_relacionados.related_id
        JOIN permissions on permissions.id = profiles_permissions.id_permission`,
        [user]
    );
    await connection.end();
    return permissions;
};

const defineAbilityFor = async (user, org) => {
    const permissions = await getPermissionsForUser(user, org);
    return defineAbility((can, cannot) => {
        permissions.forEach(permission => {
            can(permission.action, permission.subject)
        });
    });
};

const authorize = (action) => {
    return async (req, res, next) => {
        try {
            let module = req.params.module
            const ability = await defineAbilityFor(req.id, req.params.org);
            if (ability.can(action, module)) {
                next();
            } else {
                res.sendStatus(403);
            }
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    };
};

// (async () => {
//     const user = { id: '8428e096b161129d6b4' }
//     const ability = await defineAbilityFor(user)
//     console.log(ability.can("read", "Produtos"))
// })();

module.exports = { defineAbilityFor, authorize, auth };
