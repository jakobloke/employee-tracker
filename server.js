const inquirer = require ('inquirer');
const cTable = require('console.table');
const express = require('express');
const db = require('./db/database.js');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 3001;

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res) => {
    res.status(404).end();
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected!')
    //call function to prompt choices
    promptChoices();
});


displayDepartments = () => {
    console.log('Displaying departments...');
    const sql = `SELECT * FROM department ORDER BY name DESC`;

    db.query(sql, (err, rows) => {
        if(err) throw err;
        console.table(rows);

        promptChoices();
    });
};

displayRoles = () => {
    console.log('Displaying departments...');
    const sql = `SELECT * FROM role ORDER BY title DESC`;
    const sql2 = `SELECT role.title, role.salary, role.id, department.name AS department FROM role
                    LEFT JOIN department ON role.department_id = department.id ORDER BY title DESC`;
    
    db.promise().query(sql2, (err, rows) => {
        if(err) throw err;
        console.table(rows);

        promptChoices();
    });
};

displayEmployees = () => {
    console.log('Displaying employees...');
    const sql = `SELECT e.id,
                    e.first_name,
                    e.last_name,
                    role.title,
                    department.name AS department,
                    role.salary,
                    CONCAT(emp_manager.first_name, " ", emp_manager.last_name) AS manager
                    
                    FROM employee e
                        LEFT JOIN employee emp_manager ON e.manager_id = emp_manager.id
                        LEFT JOIN role ON e.role_id = role.id
                        LEFT JOIN department ON role.department_id = department.id`
    
    db.promise().query(sql, (err, rows) => {
        if (err) throw err;
        console.table(rows);

        promptChoices();
    });
};

addDept = () => {
    inquirer.prompt([
        {
            type:'input',
            message: 'What department will be added?',
            name: 'addNewDept',
            validate: deptNameInput => {
                if(deptNameInput.match('[a-zA-Z]+$')) {
                    return true;
                } else {
                    console.log('Please enter an appropriate string');
                    return false;
                }
            }
        }
    ])
    .then(answer => {
        const sql = `INSERT INTO department (name)
        VALUES (?)`;
        db.query(sql, answer.addNewDept, (err, result) => {
            if(err) throw err;
            console.log('Added Department: ' + answer.addNewDept);

            displayDepartments();
        });
    });
};

addRole = () => {
    const deptQuery = `SELECT name, id FROM department`;

    db.query(deptQuery, (err, newDepts) => {
        if(err) throw err;
        const deptChoices = newDepts.map(dept => {
            const deptChoiceRole = {name: dept.nam, value: dept.id};
            return deptChoiceRole;
        })

        inquirer.prompt([
            {
                type: 'input',
                message: 'What role will be added?', 
                name: 'addNewRole',
                validate: roleInput => {
                    if(roleInput.match('[a-zA-Z]+$')) {
                        return true;
                    } else {
                        console.log('Please enter an appropriate string');
                        return false;
                    }
                }
            },
            {
                type: 'input',
                message: 'What is the salary for this role?',
                name: 'addNewSalary',
                validate: salaryInput => {
                    if(salaryInput.match('[0-9]+$')) {
                        return true;
                    } else {
                        console.log('Please enter the Salary as an appropriate number');
                        return false;
                    }
                }
            },
            {
                type: 'list',
                message: 'What is the department for this role?',
                name: 'addRoleId',
                choices: deptChoices
            }
        ])
        .then(answer => {
            const sql = `INSERT INTO role (title, salary, department_id)
            VALUES (?, ?, ?)`;

            const params = [answer.addNewRole, answer.addNewSalary, answer.addRoleId]
            db.query(sql, params, (err, result) => {
                if(err) throw err;
                console.log('Added new role: ' + answer.addNewRole);

                displayRoles();
            })
        })
    })
};

addEmployee = () => {
    const managerQueryForEmp = `SELECT
                                empl.manager_id,
                                empl.first_name,
                                empl.last_name,
                                mgr.first_name,
                                mgr.last_name,
                                mgr.id
                                FROM employee mgr
                                LEFT JOIN employee empl ON empl.manager_id = mgr.id
                                WHERE empl.manager_id is not NULL;`
    const roleForNewEmp = `SELECT id, title, salary, department_id FROM role`;

    db.query(roleForNewEmp, (err, allRoles) => {
        if(err) throw err;

        db.query(managerQueryForEmp, (err, allManagers) => {
            if(err) throw err;

            const roleChoices = allRoles.map(role => {
                const roleChoice = {name: role.title, value: role.id};
                return roleChoice;
            })

            const managerChoices = allManagers.map(mgr => {
                const managerChoice = {name: mgr.first_name + ' ' + mgr.last_name, value: mgr.id};
                return managerChoice;
            })

            inquirer.prompt([
                {
                    type: 'input',
                    message: 'First name of the employee?',
                    name: 'addEmployeeFristName',
                    validate: firstNameInput => {
                        if(firstNameInput.match('[a-zA-Z]+$')) {
                            return true;
                        } else {
                            console.log('Please enter an appropriate first name');
                            return false;
                        }
                    }
                },
                {
                    type: 'input',
                    message: 'Last name of the employee?',
                    name: 'addEmployeeLastName',
                    validate: lastNameInput => {
                        if(lastNameInput.match('[a-zA-Z]+$')) {
                            return true;
                        } else {
                            console.log('Please enter an appropriate last name');
                            return false;
                        }
                    }
                },
                {
                    type: 'list',
                    message: 'Please select from the list of roles',
                    name: 'addEmployeeRoleId',
                    choices: roleChoices
                },
                {
                    type: 'list',
                    message: 'Please select from the list of managers',
                    name: 'addEmployeeManager',
                    choices: managerChoices
                }
            ])
            .then(answer => {
                const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                            VALUES (?, ?, ?, ?)`;
                const params = [answer.addEmployeeFristName, answer.addEmployeeLastName, answer.addEmployeeRoleId, answer.addEmployeeManager]
                db.query(sql, params, (err, result) => {
                    if(err) throw err;
                    console.log('Added role of: ' + answer.addEmployeeFristName + ' ' + answer.addEmployeeLastName);

                    displayEmployees();
                })
            })
        })
    })
};

updateEmployee = () => {
    const newEmployees = `SELECT * FROM employee`;
    const newRoles = `SELECT * FROM role`;

    db.query(newEmployees, (err, employeesForUpdate) => {
        if(err) throw err;

        db.query(newRoles, (err, rolesForUpdate) => {
            if(err) throw err;

            const choicesUpdate = employeesForUpdate.map(employee => {
                const choiceUpdate = {name: (employee.first_name + ' ' + employee.last_name) , value: employee.id};
                return choiceUpdate;
            })

            const roleChoices = rolesForUpdate.map(role => {
                const roleUpdate = {name: role.title, value: role.id};
                return roleUpdate;
            })

            inquirer.prompt([
                {
                    type:'list',
                    message: 'Please select from the list of all employees',
                    name: 'employeeUpdateList',
                    choices: choicesUpdate
                },
                {
                    type: 'list',
                    message: 'Please select from the list of all roles',
                    name: 'employeeRoleList',
                    choices: roleChoices
                }
            ])
            .then(answer => {
                const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;
                const params = [answer.employeeRoleList, answer.employeeUpdateList]
                db.query(sql, params, (err, result) => {
                    if(err) throw err;
                    console.log('Updated employee: ' + answer.employeeUpdateList + 'and role set to: ' + answer.employeeRoleList);

                    displayEmployees();
                })
            })
        })
    })
};

updateManager = () => {
    const newManagerUpdate = `SELECT * FROM employee`;
    const managerQuery = `SELECT
                            empl.manager_id,
                            empl.first_name,
                            empl.last_name,
                            man.first_name,
                            man.last_name,
                            man.id
                        FROM employee man
                        LEFT JOIN employee empl ON empl.manager_id = man.id
                        WHERE empl.manager_id is not NULL;`
    db.query(newManagerUpdate, (err, allNewManagers) => {
        if(err) throw err;

        db.query(managerQuery, (err, newManagerUpdate) => {
            if(err) throw err;

            const newManagerChoices = allNewManagers.map(employee => {
                const newManagerChoiceUpdate = {name: (employee.first_name + ' ' + employee.last_name) , value: employee.id};
                return newManagerChoiceUpdate;
            })

            const managerChoicesUpdate = newManagerUpdate.map(man => {
                const newManagerChoice = {name: man.first_name + ' ' + man.last_name, value: man.id};
                return newManagerChoice;
            })

            inquirer.prompt([
                {
                    type: 'list',
                    message: 'Please select from the list of all employees', 
                    name: 'employeeListManUpdate',
                    choices: newManagerChoices
                },
                {
                    type: 'list',
                    message: 'Please select from the list of all managers',
                    name: 'managerListForManUpdate',
                    choices: managerChoicesUpdate
                }
            ])
            .then(answer => {
                const sql = `UPDATE employee SET manager_id = ? WHERE id = ?`;
                const params = [answer.managerListForManUpdate, answer.employeeListManUpdate]
                db.query(sql, params, (err, result) => {
                    if(err) throw err;
                    console.log('Updated employee: ' + answer.employeeListManUpdate + 'and set the manager to: ' + answer.managerListForManUpdate);

                    displayEmployees();
                })
            })
        })
    })
};

viewEmployeeByManager =() => {
    console.log('Displaying all employees by manager:');

    sql = `SELECT
            empl.manager_id,
            man.first_name,
            man.last_name,
            COUNT(*)
           FROM employee empl, employee man
           WHERE empl.manager_id = man.id
           GROUP BY empl.manager_id
           ORDER by empl.manager_id DESC;`
    
    db.promise().query(sql, (err, rows) => {
        if(err) throw err;
        console.table(rows);

        promptChoices();
    })
};

viewEmployeeByDepartment = () => {
    console.log('Displaying all employees by department:');

    const sql = `SELECT department.name, COUNT(employee.id)
                    FROM employee
                    JOIN role ON employee.role_id = role.id
                    JOIN department ON role.department_id = department.id
                    GROUP BY department_id`;
    
    db.promise().query(sql, (err, rows) => {
        if(err) throw err;
        console.table(rows);

        promptChoices();
    })
};

viewBudget = () => {
    console.log('Displaying all budgets:');
    const sql = `SELECT department_id, department.name, SUM(salary)
                    FROM role
                    JOIN department ON role.department_id = department.id
                    GROUP BY department_id`;
    
    db.promise().query(sql, (err, rows) => {
        if(err) throw err;
        console.table(rows);

        promptChoices();
    })
};

deleteDepartment = () => {
    const departmentList = `SELECT * FROM department`;

    db.query(departmentList, (err, allDepartments) => {
        if(err) throw err;

        const departmentChoices = allDepartments.map(department => {
            const departmentChoice = {name: department.name, value: department.id};
            return departmentChoice;
        })

        inquirer.prompt([
            {
                type: 'list',
                message: 'Which department would you like to delete?',
                name: 'departmentName',
                choices: departmentChoices
            }
        ])
        .then(answer => {
            const sql = `DELETE FROM department WHERE id = ?`;
            const params = [answer.departmentName]
            db.query(sql, params, (err, result) => {
                if(err) throw err;
                console.log('The deleted department is: ' + answer.departmentName);

                displayDepartments
            })
        })
    })
};

deleteRole = () => {
    const roleList = `SELECT * FROM role`;

    db.query(roleList, (err, rolesToDelete) => {
        if(err) throw err;

        const roleOptionsForDelete = rolesToDelete.map(role => {
            const roleOptionForDelete = {name: role.title, value: role.id};
            return roleOptionForDelete;
        })
        inquirer.prompt([
            {
                type: 'list',
                message: 'Which role would you like to delete?',
                name: 'roleForDeletion',
                choices: roleOptionsForDelete
            }
        ])
        .then(answer => {
            const sql = `DELETE FROM role WHERE id = ?`;
            const params = [answer.roleForDeletion]
            db.query(sql, params, (err, result) => {
                if(err) throw err;
                console.log('The deleted rol was: ' + answer.roleForDeletion);

                displayRoles();
            })
        })
    })
};

deleteEmployee = () => {
    const employeeDeleteList = `SELECT * FROM employee`;
    db.query(employeeDeleteList, (err, allDeleteEmp) => {
        if(err) throw err;

        const employeeDeleteChoices = allDeleteEmp.map(employee => {
            const employeeDeleteChoice = {name: employee.first_name + ' ' + employee.last_name , value: employee.id};
            return employeeDeleteChoice;
        })

        inquirer.prompt([
            {
                type: 'list',
                message: 'Which employee would you like to delete?',
                name: 'employeeNameToDelete',
                choices: employeeDeleteChoices
            }
        ])
        .then(answer => {
            const sql = `DELETE FROM employee where id = ?`;
            const params = [answer.employeeNameToDelete]
            db.query(sql, params, (err, result) => {
                if(err) throw err;
                console.log('The employee that has been removed is: ' + answer.employeeNameToDelete);

                displayEmployees();
            })
        })
    })
};

const promptChoices = function() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'initialChoices',
            message: 'What would you like to do?',
            choices: [
                'Display all departments',
                'Display all roles',
                'Display all employees',
                'Add department',
                'Add role',
                'Add employee',
                'Update employee role',
                'Update manager',
                'Display employees by their manager',
                'Display employees by department',
                'Delete a department',
                'Delete a role',
                'Delete an employee',
                'View a department budget'
            ],
            validate: choiceSlection => {
                if(choiceSlection) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    ])
    .then((answers) => {
        const{initialChoices} = answers;

        if(initialChoices === 'Display all departments') {
            displayDepartments();
        }
        if(initialChoices === 'Display all roles') {
            displayRoles();
        }
        if(initialChoices === 'Display all employees') {
            displayEmployees();
        }
        if(initialChoices === 'Add department') {
            addDept();
        }
        if(initialChoices === 'Add role') {
            addRole();
        }
        if(initialChoices === 'Add employee') {
            addEmployee();
        }
        if(initialChoices === 'Update employee role') {
            updateEmployee();
        }
        if(initialChoices === 'Update manager') {
            updateManager();
        }
        if(initialChoices === 'Display employees by their manager') {
            viewEmployeeByManager();
        }
        if(initialChoices === 'Display employees by department') {
            viewEmployeeByDepartment();
        }
        if(initialChoices === 'Delete a department') {
            deleteDepartment();
        }
        if(initialChoices === 'Delete a role') {
            deleteRole();
        }
        if(initialChoices === 'Delete an employee') {
            deleteEmployee();
        }
        if(initialChoices === 'View a department budget') {
            viewBudget();
        }
    });
}