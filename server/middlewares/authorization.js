

//? template authorization 
// const authorization = async (req, res, next) => {
//     try {

//         const validUser = await User.findByPk(req.user)
//         if (!validUser) throw { name: `unauthorized` }

//         const checkMovie = await Movie.findByPk(req.params.id)
//         if (!checkMovie) throw { name: `unauthorized` }

//         next()
//     } catch (error) {
//         next(error)
//     }
// }




// module.exports = { authorization }