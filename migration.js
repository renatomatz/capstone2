const sqlite = require("sqlite3")

const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

const throwError = function(error) {
  if (error) {
    throw error
  }
}

//  db.run(`DROP TABLE Employee`, throwError)
//  db.run(`DROP TABLE Timesheet`, throwError)
//  db.run(`DROP TABLE Menu`, throwError)
//  db.run(`DROP TABLE MenuItem`, throwError)


db.serialize(() => {
  db.run(`CREATE TABLE Employee (id INTEGER PRIMARY KEY,
                                 name TEXT NOT NULL,
                                 position TEXT NOT NULL,
                                 wage INTEGER NOT NULL,
                                 is_current_employee INTEGER DEFAULT 1)`,
          throwError)
  db.run(`CREATE TABLE Timesheet (id INTEGER PRIMARY KEY,
                                  hours INTEGER NOT NULL,
                                  rate INTEGER NOT NULL,
                                  date INTEGER NOT NULL,
                                  employee_id INTEGER NOT NULL,
                                  FOREIGN KEY(employee_id) REFERENCES Employee(id))`,
          throwError)
  db.run(`CREATE TABLE Menu (id INTEGER PRIMARY KEY,
                             title TEXT NOT NULL)`,
          throwError)
  db.run(`CREATE TABLE MenuItem (id INTERGER PRIMARY KEY,
                                 name TEXT NOT NULL,
                                 description TEXT,
                                 inventory INTEGER NOT NULL,
                                 price INTEGER NOT NULL,
                                 menu_id INTEGER NOT NULL,
                                 FOREIGN KEY(menu_id) REFERENCES Menu(id))`,
          throwError)
})
