const { Model, DataTypes } = require("sequelize");

// Definirea celei de-a doua entitati
module.exports = (sequelize, DataTypes) => {
    class CrewMember extends Model {
        static associate(models) {
            // relatia dintre cele doua entitati
            models.CrewMember.belongsTo(models.Ship, {
                foreignKey: "ship_id",
            });
        }
    }
    CrewMember.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            crewMemberName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    len: [3, 40]
                },
            },
            role: {
                type: DataTypes.ENUM(["CAPTAIN", "BOATSWAIN"]),
                allowNull: false
            },

                // many to one
                ship_id: DataTypes.INTEGER
            },
        {
            sequelize,
            modelName: "CrewMember",
        }
    );
    return CrewMember;
};
