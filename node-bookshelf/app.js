const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "パスワードをここに入力",
  database: "bookshelf",
});

const sql = `
INSERT INTO books (title, author)
VALUES ('HTML入門', '鈴木一郎')
`;

connection.query(sql, (err, results) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(results);

  connection.end();
});
