const { Model, DataTypes } = require("sequelize");

// Definirea primei entitati
module.exports = (sequelize, DataTypes) => {
    class Ship extends Model {
        // relatia dintre cele 2 entitati
        static associate(models) {
            // one to many
            models.Ship.hasMany(models.CrewMember);
        }
    }
    Ship.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
              },
              shipName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                  len: [3, 40]
                }
              },
              displacement: {
                type: DataTypes.INTEGER,
                validate: {
                  min: 50
                }
              }
        },
        {
            sequelize,
            modelName: "Ship",
        }
    );
    return Ship;
};
