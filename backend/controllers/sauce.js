
//Récuperation du schema pour les sauces
const Sauce = require('../models/Sauce');
// Récuperation du package FileSystem
const fs = require('fs');

// Logique metier - Récupération de toutes les sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

// Logique metier - Récupération d'une sauce
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

// Logique metier - Création d'une sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))
        .catch(error => res.status(400).json({ error }));
};

// Logique metier - Modification d'une sauce
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
        .catch(error => res.status(400).json({ error }));
};

// Logique metier - Suppression d'une sauce
exports.deleteSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet supprimé !' }))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

// Like/dislike sauce
exports.likeSauce = (req, res, next) => {
    // Pour la route READ = Ajout/suppression d'un like / dislike à une sauce
    // Like présent dans le body
    let like = req.body.like
    // On prend le userID
    let userId = req.body.userId
    // On prend l'id de la sauce
    let sauceId = req.params.id

    if (like === 1) { // Si il s'agit d'un like
        Sauce.updateOne({
            _id: sauceId
        }, {
            // On push l'utilisateur et on incrémente le compteur de 1
            $push: {
                usersLiked: userId
            },
            $inc: {
                likes: +1
            }, // On incrémente de 1
        })
            .then(() => res.status(200).json({
                message: 'j\'aime ajouté !'
            }))
            .catch((error) => res.status(400).json({
                error
            }))
    }
    if (like === -1) {
        Sauce.updateOne( // S'il s'agit d'un dislike
            {
                _id: sauceId
            }, {
            $push: {
                usersDisliked: userId
            },
            $inc: {
                dislikes: +1
            }, // On incrémente de 1
        }
        )
            .then(() => {
                res.status(200).json({
                    message: 'Dislike ajouté !'
                })
            })
            .catch((error) => res.status(400).json({
                error
            }))
    }
    if (like === 0) { // Si il s'agit d'annuler un like ou un dislike
        Sauce.findOne({
            _id: sauceId
        })
            .then((sauce) => {
                if (sauce.usersLiked.includes(userId)) { // Si il s'agit d'annuler un like
                    Sauce.updateOne({
                        _id: sauceId
                    }, {
                        $pull: {
                            usersLiked: userId
                        },
                        $inc: {
                            likes: -1
                        }, // On incrémente de -1
                    })
                        .then(() => res.status(200).json({
                            message: 'Like retiré !'
                        }))
                        .catch((error) => res.status(400).json({
                            error
                        }))
                }
                if (sauce.usersDisliked.includes(userId)) { // Si il s'agit d'annuler un dislike
                    Sauce.updateOne({
                        _id: sauceId
                    }, {
                        $pull: {
                            usersDisliked: userId
                        },
                        $inc: {
                            dislikes: -1
                        }, // On incrémente de -1
                    })
                        .then(() => res.status(200).json({
                            message: 'Dislike retiré !'
                        }))
                        .catch((error) => res.status(400).json({
                            error
                        }))
                }
            })
            .catch((error) => res.status(404).json({
                error
            }))
    }
}