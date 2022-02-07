const express = require('express')
const bodyParser = require('body-parser')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const cors = require('cors')

const db = require("./models");

const Ship = db.Ship;
const CrewMember = db.CrewMember;

// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: 'sample.db',
//   define: {
//     timestamps: false
//   }
// })

// const Ship = sequelize.define('ship', {
//   id: {
//     type: Sequelize.INTEGER,
//     autoIncrement: true,
//     primaryKey: true
//   },
//   shipName: {
//     type: Sequelize.STRING,
//     allowNull: false,
//     validate: {
//       len: [3, 40]
//     }
//   },
//   displacement: {
//     type: Sequelize.INTEGER,
//     validate: {
//       min: 50
//     }
//   }
// })

// const CrewMember = sequelize.define('crewmember', {
//   id: {
//     type: Sequelize.INTEGER,
//     autoIncrement: true,
//     primaryKey: true
//   },
//   crewMemberName: {
//     type: Sequelize.STRING,
//     allowNull: false,
//     validate: {
//       len: [3, 40]
//     }
//   },

//   role: {
//     type: Sequelize.ENUM(["CAPTAIN", "BOATSWAIN"])
//   },
//   ShipID: {
//     type: Sequelize.INTEGER
//   }

// })

// Ship.hasMany(CrewMember)
// CrewMember.belongsTo(Ship, {
//   foreignKey: "ShipID"
// })

const app = express()
app.use(cors())
app.use(bodyParser.json())



app.get('/sync', async (req, res) => {
  try {
    await db.sequelize.sync({ force: true })
    res.status(201).json({ message: 'created' })
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})



//aici tre sa modific
app.get('/ships', async (req, res) => {
  try {
    const query = {}
    let pageSize = 2//pe o pagina doar 2 elemente din baza de date
    const allowedFilters = ['shipName', 'displacement']
    const filterKeys = Object.keys(req.query).filter(e => allowedFilters.indexOf(e) !== -1)
    if (filterKeys.length > 0) {//filtreaza query din request
      query.where = {}
      for (const key of filterKeys) {
        query.where[key] = {
          [Op.like]: `%${req.query[key]}%`
        }
      }
    }

    const sortField = req.query.sortField
    let sortOrder = 'ASC'
    if (req.query.sortOrder && req.query.sortOrder === '-1') {
      sortOrder = 'DESC'
    }

    if (req.query.pageSize) {
      pageSize = parseInt(req.query.pageSize)
    }

    if (sortField) {
      query.order = [[sortField, sortOrder]]
    }

    if (!isNaN(parseInt(req.query.page))) {
      query.limit = pageSize
      query.offset = pageSize * parseInt(req.query.page)
    }

    const records = await Ship.findAll(query)//eleemntele din baza de date
    const count = await Ship.count()
    res.status(200).json({ records, count })
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

//cred ca e ok
app.post('/ships', async (req, res) => {
  try {
    if (req.query.bulk && req.query.bulk === 'on') {
      await Ship.bulkCreate(req.body)
      res.status(201).json({ message: 'created' })
    } else {
      await Ship.create(req.body)
      res.status(201).json({ message: 'created' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

//cred ca e ok
app.get('/ships/:id', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.id)
    if (ship) {
      res.status(200).json(ship)
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})


app.put('/ships/:id', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.id)
    if (ship) {
      await ship.update(req.body, { fields: ['id', 'shipName', 'displacement'] })
      res.status(202).json({ message: 'accepted' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.delete('/ships/:id', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.id, { include: CrewMember })
    if (ship) {
      await ship.destroy()
      res.status(202).json({ message: 'accepted' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})


app.get('/ships/:id/crewmembers', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.id)
    if (ship) {
      const crewmembers = await CrewMember.findAll({
        where: {
          ship_id: req.params.id
        }
      });

      res.status(200).json(crewmembers)
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.get('/ships/:sid/crewmembers/:cid', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.sid)
    if (ship) {
      const crewmembers = await ship.getCrewMembers({ where: { id: req.params.cid } })
      res.status(200).json(crewmembers.shift())
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.post('/ships/:id/crewmembers', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.id)
    if (ship) {
      const crewmember = req.body
      crewmember.shipId = ship.id
      console.warn(crewmember)
      await CrewMember.create({
        ...req.body,
        ship_id: req.params.id
      })
      res.status(201).json({ message: 'created' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.put('/ships/:shipid/crewmembers/:id', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.shipid)
    if (ship) {
      const crewmember = await CrewMember.findAll({
        where: {
          ship_id: req.params.shipid,
          id: req.params.id
        }
      });
      if (crewmember) {
        await CrewMember.update(req.body, {
          where: {
            id: req.params.id
          }
        })
        res.status(202).json({ message: 'accepted' })
      } else {
        res.status(404).json({ message: 'not found' })
      }
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.delete('/ships/:shipid/crewmembers/:id', async (req, res) => {
  try {
    const ship = await Ship.findByPk(req.params.shipid)
    if (ship) {
      const crewmember = await CrewMember.findAll({
        where: {
          ship_id: req.params.shipid,
          id: req.params.id
        }
      });
      if (crewmember) {
        await CrewMember.destroy({
          where: {
            id: req.params.id
          }
        })
        res.status(202).json({ message: 'accepted' })
      } else {
        res.status(404).json({ message: 'not found' })
      }
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.listen(process.env.PORT || 8000, () => console.log('Server deschis pe 8000'));
