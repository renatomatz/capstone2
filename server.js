// require packages
const express = require("express")
const sqlite = require("sqlite3")
const errorHandler = require("errorhandler")
const morgan = require("morgan")
const bodyParser = require("body-parser")

// main setups
const app = express()
const db = new sqlite.Database(process.env.TEST_DATABASE || "./database.sqlite")

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {console.log(`Server is listening on port ${PORT}`)})

// body parsing, error handling and formatting
app.use(morgan("tiny"))
app.use(bodyParser.json())
app.use(errorHandler())

// employee main routes
const employeeRouter = express.Router()
app.use("/api/employees", employeeRouter)

const checkEmployeeFields = (req, res, next) => {
  const employee = req.body.employee
  if (!employee.name || !employee.position || !employee.wage) {
    res.status(400).send("missing fields")
  } else {
    next()
  }
}

employeeRouter.param("employeeId", (req, res, next, eId) => {
  db.get(`SELECT * FROM Employee WHERE id = $id`,
         {$id: eId},
         (error, row) => {
           if (!row) {
             res.status(404).send("Employee not found");
           } else {
             next();
           }
         })
})

employeeRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (error, rows) => {
    res.status(200).send({employees: rows})
  })
})

employeeRouter.post("/", checkEmployeeFields, (req, res, next) => {
  const employee = req.body.employee
  db.run(`INSERT INTO Employee(name, position, wage) VALUES($name, $position, $wage)`,
         {$name: employee.name,
          $position: employee.position,
          $wage: employee.wage},
         function(error) {
           db.get(`SELECT * FROM Employee WHERE id = $id`,
                  {$id: this.lastID},
                  (error, row) => {
                    res.status(201).send({employee: row})
                  })
         })
})

employeeRouter.get("/:employeeId", (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE id = $eId`,
        {$eId: req.params.employeeId},
        (error, row) => {
          res.status(200).send({employee: row})
        })
})

employeeRouter.put("/:employeeId", checkEmployeeFields, (req, res, next) => {
  const employee = req.body.employee
  db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id`,
         {$name: employee.name,
          $position: employee.position,
          $wage: employee.wage,
          $id: req.params.employeeId},
         function(error) {
           db.get(`SELECT * FROM Employee WHERE id = $eId`,
                  {$eId: req.params.employeeId},
                  (error, row) => {
                    res.status(200).send({employee: row})
                  })
         })
})

employeeRouter.delete("/:employeeId", (req, res, next) => {
  db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $eId",
        {$eId: req.params.employeeId},
        function(error) {
          db.get(`SELECT * FROM Employee WHERE id = $eId2`,
                {$eId2: req.params.employeeId},
                (error, row) => {
                  res.status(200).send({employee: row})
                })
        })
})

// time sheets routes
const timeSheetRouter = express.Router({mergeParams: true})
employeeRouter.use("/:employeeId/timesheets", timeSheetRouter)

const checkTimeSheetFields = (req, res, next) => {
  const timeSheet = req.body.timesheet
  if (!timeSheet.hours || !timeSheet.rate || !timeSheet.date) {
    res.status(400).send("missing fields")
  } else {
    next()
  }
}

timeSheetRouter.param("timesheetId", (req, res, next, tsId) => {
  db.get(`SELECT * FROM Timesheet WHERE id = $tsId`,
        {$tsId: tsId},
        (error, row) => {
          if (!row) {
            res.status(404).send("Employee not found")
          } else {
            next()
          }
        })
})

timeSheetRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE employee_id = $eId`,
        {$eId: req.params.employeeId},
        (error, rows) => {
          res.status(200).send({timesheets: rows})
        })
})

timeSheetRouter.post("/", checkTimeSheetFields, (req, res, next) => {
  const timeSheet = req.body.timesheet
  db.run(`INSERT INTO Timesheet(hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $eId)`,
        {$hours: timeSheet.hours,
         $rate: timeSheet.rate,
         $date: timeSheet.date,
         $eId: req.params.employeeId},
         function(error) {
           db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
                 (error, row) => {
                   res.status(201).send({timesheet: row})
                 })
         })
})

timeSheetRouter.put("/:timesheetId", checkTimeSheetFields, (req, res, next) => {
  const timeSheet = req.body.timesheet
  db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $tsId`,
        {$hours: timeSheet.hours,
         $rate: timeSheet.rate,
         $date: timeSheet.date,
         $tsId: req.params.timesheetId},
         function(error) {
           db.get(`SELECT * FROM Timesheet WHERE id = $tsId`,
                 {$tsId: req.params.timesheetId},
                 (error, row) => {
                   res.status(200).send({timesheet: row})
                 })
         })
})

timeSheetRouter.delete("/:timesheetId", (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE id = $tsId`,
        {$tsId: req.params.timesheetId},
        function(error) {
          res.status(204).send()
        })
})

// menu routes
const menuRouter = express.Router()
app.use("/api/menus", menuRouter)

const checkMenuFields = (req, res, next) => {
  const menu = req.body.menu
  if (!menu.title) {
    res.status(400).send("missing fields")
  } else {
    next()
  }
}

menuRouter.param("menuId", (req, res, next, mId) => {
  db.get(`SELECT * FROM Menu WHERE id = $mId`,
        {$mId: req.params.menuId},
        (error, row) => {
          if(!row) {
            res.status(404).send("menu not found")
          } else {
            next()
          }
        })
})

menuRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (error, rows) => {
    res.status(200).send({menus: rows})
  })
})

menuRouter.post("/",  checkMenuFields, (req, res, next) => {
  const menu = req.body.menu
  db.run(`INSERT INTO Menu(title) VALUES($title)`,
        {$title: menu.title},
        function(error) {
          db.get(`SELECT * FROM Menu WHERE id = $mId`,
                {$mId: this.lastID},
                (error, row) => {
                  res.status(201).send({menu: row})
                })
        })
})

menuRouter.get("/:menuId", (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE id = $mId`,
        {$mId: req.params.menuId},
        (error, row) => {
          res.status(200).send({menu: row})
        })
})

menuRouter.put("/:menuId", checkMenuFields, (req, res, next) => {
  db.run(`UPDATE Menu SET title = $title WHERE id = $mId`,
        {$title: req.body.menu.title,
         $mId: req.params.menuId},
         function(error) {
          db.get(`SELECT * FROM Menu WHERE id = $mId`,
                {$mId: req.params.menuId},
                (error, row) => {
                  res.status(200).send({menu: row})
                })
         })
})

menuRouter.delete("/:menuId",
  (req, res, next) => { //callback1 - check for existing menu items
    db.get(`SELECT * FROM MenuItem WHERE menu_id = $mId`,
          {$mId: req.params.menuId},
          (error, row) => {
            if (row) {
              res.status(400).send("menu has items in it")
            } else {
              next()
            }
          })},
  (req, res, next) => { //callback2 - delete menu
    db.run(`DELETE FROM Menu WHERE id = $mId`,
          {$mId: req.params.menuId},
          function(error) {
            res.status(204).send()
          })
})

// menu items routes
const menuItemRouter = express.Router({mergeParams: true})
menuRouter.use("/:menuId/menu-items", menuItemRouter)

const checkMenuItemFields = (req, res, next) => {
  const item = req.body.menuItem
  if (!item.name || !item.description || !item.inventory || !item.price) {
    res.status(400).send("missing filed(s)")
  } else {
    next()
  }
}

menuItemRouter.param("menuItemId", (req, res, next, miId) => {
  db.get(`SELECT * FROM MenuItem WHERE id = $miId`,
        {$miId: miId},
        (error, row) => {
          if (!row) {
            res.status(404).send("menu item not found")
          } else {
            next()
          }
        })
})

menuItemRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = $mId`,
        {$mId: req.params.menuId},
        (error, rows) => {
          res.status(200).send({menuItems: rows})
        })
})

menuItemRouter.post("/", checkMenuItemFields, (req, res, next) => {
  const item = req.body.menuItem
  db.run(`INSERT INTO MenuItem(name, description, inventory, price, menu_id)
          VALUES($name, $description, $inventory, $price, $mId)`,
        {$name: item.name,
         $description: item.description,
         $inventory: item.inventory,
         $price: item.price,
         $mId: req.params.menuId},
         function(error) {
          db.get(`SELECT * FROM MenuItem WHERE id = $miId`,
                {$miId: this.lastID},
                (error, row) => {
                  res.status(201).send({menuItem: row})
                })
         })
})

menuItemRouter.put("/:menuItemId", checkMenuItemFields, (req, res, next) => {
  const item = req.body.menuItem
  db.run(`UPDATE MenuItem
          SET name = $name, description = $description,
              inventory = $inventory, price = $price
          WHERE id = $miId`,
        {$name: item.name,
         $description: item.description,
         $inventory: item.inventory,
         $price: item.price,
         $miId: req.params.menuItemId},
         function(error) {
          db.get(`SELECT * FROM MenuItem WHERE id = $miId2`,
                {$miId2: req.params.menuItemId},
                (error, row) => {
                  res.status(200).send({menuItem: row})
                })
         })
})

menuItemRouter.delete("/:menuItemId", (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE id = $miId`,
        {$miId: req.params.menuItemId},
        function(error) {
          res.status(204).send()
        })
})





























module.exports = app
