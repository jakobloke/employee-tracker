INSERT INTO department (id, name)
VALUES
    (1, 'Finance'),
    (2, 'Legal'),
    (3, 'Engineering'),
    (4, 'Sales');

INSERT INTO role
    (title, salary, department_id)
VALUES
   ('Account Lead', 150000, 1),
   ('Accountant', 100000, 1),
   ('Legal Team Lead', 200000, 2),
   ('Lawyer', 175000, 2),
   ('Lead Engineer', 180000, 3),
   ('Software Engineer', 125000, 3),
   ('Sales Lead', 100000, 4),
   ('Salesperson', 80000, 4);

INSERT INTO employee
    (first_name, last_name, role_id, manager_id)
VALUES
    ('John', 'Deer', 1, NULL),
    ('Josh', 'Allen', 2, 1),
    ('Tara', 'Doherty', 3, NULL),
    ('Niklas', 'Braun', 4, 3),
    ('Tom', 'Brady', 5, NULL),
    ('Moe', 'Bamba', 6, 5),
    ('Moose', 'Tracks', 7, NULL),
    ('Jake', 'Brow', 8, 7);