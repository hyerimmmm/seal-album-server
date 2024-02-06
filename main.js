const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const pg = require("pg");
const bcrypt = require("bcrypt");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const client = new pg.Pool({
  host: "localhost",
  user: "postgres",
  password: "2486",
  database: "postgres",
  port: 5432,
  max: 5,
});

client.connect((err) => {
  if (err) {
    console.log("Failed to connect db " + err);
  } else {
    console.log("Connect to db done!");
  }
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      console.log("비밀번호 해시화 에러:", err);
      res.status(500).json({
        state: false,
        msg: "비밀번호 해시화 서버 에러",
      });
      return;
    }
    console.log(hashedPassword);
    const users = [req.body.email, req.body.nickname, hashedPassword];
    client.query(
      "SELECT * FROM users WHERE email = $1",
      [users[0]],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).json({
            state: false,
            msg: "서버 에러",
          });
          return;
        }
        if (result.rows.length > 0) {
          res.status(200).json({
            state: false,
            msg: "이미 존재하는 이메일입니다",
          });
        } else {
          const sql =
            "INSERT INTO users(email, nickname, password) VALUES ($1, $2, $3)";
          client.query(sql, users, (err) => {
            if (err) {
              console.log(err);
              res.status(500).json({
                state: false,
                msg: "서버 에러",
              });
              return;
            }
          });
          console.log("성공");
          res.status(200).json({
            state: true,
            msg: "회원가입 성공",
          });
        }
      }
    );
  });
});

app.post("/login", (req, res) => {
  console.log("로그인 불려짐");
  const users = [req.body.email, req.body.password];
  client.query(
    "SELECT * FROM users WHERE email = $1",
    [users[0]],
    (err, result) => {
      if (err) {
        console.log("서버에러" + err);
        res.status(500).json({
          state: false,
          msg: "서버에러",
        });
        return;
      }
      // JSON.stringify(result.rows[0].email) !== JSON.stringify(users[0]);
      if (result.rows.length < 1) {
        console.log("없는 이메일");
        res.status(200).json({
          state: true,
          msg: "없는 이메일입니다",
        });
      } else if (
        JSON.stringify(result.rows[0].email) === JSON.stringify(users[0])
      ) {
        console.log("존재하는 이메일");
        client.query(
          "SELECT * FROM users WHERE password = $1",
          [users[1]],
          (err, row) => {
            if (err) {
              console.log("서버에러");
              res.status(500).json({
                state: false,
                msg: "서버에러",
              });
              return;
            } else if (row.rows.length < 1) {
              console.log("존재하지 않는 비밀번호");
            } else {
              bcrypt.compare(
                `` + users[1],
                JSON.stringify(row.rows),
                (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("비밀번호 일치");
                    res.status(200).json({
                      state: true,
                      msg: "로그인 성공",
                    });
                  }
                }
              );
            }
          }
        );
      }
      //  else {
      //   console.log("비밀번호 에러");
      //   const hashedPasswordFromDatabase = result; // 실제 데이터베이스에서 가져온 해시
      //   const inputPassword = req.body.password;
      //   console.log(hashedPasswordFromDatabase, "뭐찍혀 너");
      //   bcrypt.compare(
      //     inputPassword,
      //     hashedPasswordFromDatabase,
      //     function (err, result) {
      //       if (err) {
      //         console.error(err);
      //       } else {
      //         console.log("Password Match:", result);
      //       }
      //     }
      //   );
      // }
    }
  );
});
app.listen(4000, () => {
  console.log("Express server is listening on port 4000");
});
