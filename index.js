// const firebaseConfig = {
//     apiKey: "AIzaSyBS6YwK9J36HbCRapoZp9_yKxhiammk13c",
//     authDomain: "checkname-1fdfe.firebaseapp.com",
//     projectId: "checkname-1fdfe",
//     storageBucket: "checkname-1fdfe.appspot.com",
//     messagingSenderId: "533214256152",
//     appId: "1:533214256152:web:6bcaf44596469fce17376d",
//     measurementId: "G-ZZXF64KNME"
// }
const firebaseConfig = {
    apiKey: "AIzaSyD1b57Gu7RmvDnFos1jfqttcjodDAuL-RQ",
    authDomain: "test-8ea4c.firebaseapp.com",
    projectId: "test-8ea4c",
    storageBucket: "test-8ea4c.appspot.com",
    messagingSenderId: "545188803656",
    appId: "1:545188803656:web:afdf45fb7f846bc290147d",
    measurementId: "G-92S9RP518C"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const vuetify = Vuetify.createVuetify();
const app = Vue.createApp({
    data() {
        return {
            newQuestionAdded: false,
            addTeacherWarning: false,
            addTeacherSuccess: false,
            showQuizBox: false,
            showLogout: false,
            showDialog: false,
            alertType: '',
            user: null,
            userRole: '',
            checkin: [],
            newcheckin: { id: '', room: '', class_date: '', subject: '' },
            initialID: '',
            students: [],
            studentFound: false,
            studentInfo: { id: '', sid: '', email: '', name: '', section: '' , answer: '' },
            latestCheckin: { id: '' },
            newQuestion: {question: '', id: ''},
            latestQuestion: null,
            questionList: [],
            question: {question:''},
        };
    },


    mounted() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.user = {
                    email: user.email,
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                };
                this.checkUserRole(user.email);
                this.fetchTeachers();
                this.fetchLatestStudentData();
                this.fetchLatestQuestion();
                this.autoReadQuestion();
            } else {
                this.user = null;
            }
        });
        this.autoRead();
        // this.readQuestion();
        this.readQuestion(this.latestCheckin.id);

    },

    methods: {
        deleteData(std) {
            if (confirm("ต้องการลบข้อมูล")) {
                db.collection("Students").doc(std.id).delete()
                    .then(() => {
                        console.log("Document successfully deleted!");
                        // ลบข้อมูลออกจาก students หลังจากลบจากฐานข้อมูล
                        this.students = this.students.filter(student => student.id !== std.id);
                    })
                    .catch((error) => {
                        console.error("Error removing document: ", error);
                    });
            }
        },
        checkUserRole(email) {
            db.collection("Teachers").where("email", "==", email).get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        this.userRole = 'Teacher';
                    } else {
                        this.userRole = 'Student';
                    }
                })
                .catch((error) => {
                    console.error("Error checking user role:", error);
                });
        },

        autoRead() {
            db.collection("Students").onSnapshot((studentSnapshot) => {
                var studentList = [];

                // ดึงข้อมูลจากตาราง "Students"
                studentSnapshot.forEach((studentDoc) => {
                    const studentData = { id: studentDoc.id, ...studentDoc.data() };
                    const studentID = studentData.id;

                    db.collection("checkin").where("id", "==", studentID)
                        .onSnapshot((checkinSnapshot) => {
                            checkinSnapshot.docChanges().forEach((change) => {
                                if (change.type === "added") {
                                    const checkinData = change.doc.data();
                                    // เช็คว่าไอดีใน checkin ตรงกับ this.latestCheckin.id หรือไม่
                                    if (checkinData.id === this.latestCheckin.id) {
                                        studentList.push(studentData);
                                    }
                                }
                            });
                        }, (error) => {
                            console.error("Error checking checkin data: ", error);
                        });


                    // // เช็คว่ามี ID ของนักเรียนนั้นในตาราง "checkin" หรือไม่
                    // db.collection("checkin").where("id", "==", studentID)
                    //     .get()
                    //     .then((checkinSnapshot) => {
                    //         if (!checkinSnapshot.empty) {
                    //             // หากมีให้เพิ่มข้อมูลนักเรียนนั้นใน studentList
                    //             checkinSnapshot.forEach((checkinDoc) => {
                    //                 const checkinData = checkinDoc.data();
                    //                 // เช็คว่าไอดีใน checkin ตรงกับ this.latestCheckin.id หรือไม่
                    //                 if (checkinData.id === this.latestCheckin.id) {
                    //                     studentList.push(studentData);
                    //                 }
                    //             });
                    //         }
                    //     })
                    //     .catch((error) => {
                    //         console.error("Error checking checkin data: ", error);
                    //     });
                });
                setTimeout(() => {
                    this.students = studentList;
                }, 1000); // กำหนดให้รอ 1 วินาทีเพื่อให้เช็คข้อมูลจาก Firebase ได้เสร็จสมบูรณ์
            });
        },
        question() {
            db.collection("checkin").doc(this.latestCheckin.id).get()
                .then((checkinDoc) => {
                    if (checkinDoc.exists) {
                        const checkinData = checkinDoc.data();
                        const questionID = checkinData.questionID;

                        db.collection("question").doc(questionID).get()
                            .then((questionDoc) => {
                                if (questionDoc.exists) {
                                    const questionData = questionDoc.data();
                                    console.log("Question Data:", questionData);
                                } else {
                                    console.log("No question found with ID:", questionID);
                                }
                            })
                            .catch((error) => {
                                console.error("Error getting question document:", error);
                            });
                    } else {
                        console.log("No checkin found with ID:", this.latestCheckin.id);
                    }
                })
                .catch((error) => {
                    console.error("Error getting checkin document:", error);
                });
        },

        addTeacher() {
            if (!this.newcheckin.id) {
                this.newcheckin.id = this.generateRandomID();
            }
            if (this.newcheckin.room && this.newcheckin.class_date && this.newcheckin.subject) {
                db.collection("checkin").add(this.newcheckin)
                    .then((docRef) => {
                        db.collection("checkin").doc(docRef.id).get()
                            .then((doc) => {
                                if (doc.exists) {
                                    this.latestCheckin.id = this.generateRandomID();
                                    this.latestCheckin.room = this.newcheckin.room;
                                    this.latestCheckin.subject = this.newcheckin.subject;
                                    this.latestCheckin.class_date = this.newcheckin.class_date;
                                    this.newcheckin = { id: '', room: '', class_date: '', subject: '' };
                                    this.fetchTeachers();

                                    this.addTeacherSuccess = true;
                                    // alert('บันทึกเรียบร้อย');
                                } else {
                                    console.log("No such document!");
                                }
                            })
                            .catch((error) => {
                                console.log("Error getting document:", error);
                            });
                    })
                    .catch((error) => {
                        this.addTeacherWarning = true;
                        console.error("Error adding teacher: ", error);
                    });
            } else {
                this.addTeacherWarning = true;
                console.error("Please fill in all fields.");
            }
        },

        submitAdditionalData() {
            const { sid, email, name, section, answer } = this.studentInfo;

            if (sid && email && name && section && answer) {
                const newData = {
                    sid: sid,
                    email: email,
                    name: name,
                    section: section,
                    answer: answer,
                    id: this.newcheckin.id // ใช้ค่ารหัสที่รับมาจาก input newcheckin.id
                };

                db.collection("Students").add(newData)
                    .then(() => {
                        console.log("Student data added successfully!");
                        this.studentInfo = { id: '', sid: '', email: '', name: '', section: '' , answer: '' };
                        this.fetchLatestStudentData();
                        this.students.push(newData); // เพิ่มข้อมูลใหม่เข้าไปใน students
                        alert('Student data added successfully!');
                    })
                    .catch((error) => {
                        console.error("Error adding student data: ", error);
                    });
            } else {
                alert('Please fill in all fields.');
            }
        },
        checkStudent() {
            this.readQuestion(this.newcheckin.id);
            const studentID = this.newcheckin.id;
            if (studentID) {
                db.collection("checkin").where("id", "==", studentID)
                    .get()
                    .then((querySnapshot) => {
                        if (!querySnapshot.empty) {
                            // alert('Student found.');
                            this.alertType = 'found';
                            // this.showDialog = true;

                            this.studentFound = true;
                            querySnapshot.forEach((doc) => {
                                this.studentInfo = doc.data();
                            });
                        } else {
                            // alert('Student not found.');
                            this.alertType = 'notFound';
                            this.showDialog = true;
                        }
                    })
                    .catch((error) => {
                        console.error("Error checking student: ", error);
                        alert('An error occurred while checking student.');
                    });
            } else {
                // alert('Please enter student ID.');
                this.alertType = 'empty';
                this.showDialog = true;
            }
        },

        generateRandomID() {
            if (!this.initialID) {
                let randomID = '';
                const characters = '0123456789';
                const charactersLength = characters.length;
                for (let i = 0; i < 5; i++) {
                    randomID += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                this.initialID = randomID;
                return randomID;
            } else {
                return this.initialID;
            }
        },
        toggleQuizBox() {
            this.showQuizBox = !this.showQuizBox;
        },
        confirmGoogleLogout() {
            this.showLogout = true;
        },
        logout() {
            firebase.auth().signOut();
            window.location.href = 'index.html';
        },
        // addQuestion() {
        //     // ตรวจสอบว่า newQuestion ถูกกำหนดหรือไม่
        //     if (!this.newQuestion) {
        //         this.newQuestion = {};
        //     }

        //     // เชื่อมต่อกับ Firestore database
        //     const db = firebase.firestore();

        //     // เพิ่มคำถามลงในคอลเล็กชัน question
        //     db.collection("question").add({
        //         question: this.newQuestion.question,
        //         id: this.generateRandomID(), 
        //     })
        //     .then(docRef => {
        //         console.log("Question added with ID: ", docRef.id);
        //         this.addTeacherSuccess = true;
        //         // alert("Question added successfully!");
        //     })
        //     .catch(error => {
        //         console.error("Error adding question: ", error);
        //         this.addTeacherWarning = true;
        //         // alert("Error adding question. Please try again later.");
        //     });
        // },

        addQuestion() {
            if (!this.newQuestion) {
                this.newQuestion = {};
            }
                db.collection("question").add({
                    question: this.newQuestion.question,
                    id: this.generateRandomID(), 
                })
                    .then((docRef) => {
                        this.newQuestionAdded = true;
                        db.collection("checkin").where("id", "==", newQuestion.id).get()
                        .then((doc) => {
                                if (doc.exists) {
                                    this.newQuestion.question = this.newQuestion.question;
                                    this.newQuestion = { id: '', question: '' };
                                    // this.fetchTeachers();

                                    this.addTeacherSuccess = true;
                                    // alert('บันทึกเรียบร้อย');
                                } else {
                                    console.log("No such document!");
                                }
                            })
                            .catch((error) => {
                                console.log("Error getting document:", error);
                            });
                    })
                    .catch((error) => {
                        this.addTeacherWarning = true;
                        console.error("Error adding teacher: ", error);
                    });

        },

        readQuestion(id) {
            db.collection("question").where("id", "==", id).onSnapshot((snapshot) => {
              snapshot.forEach((doc) => {
                if (doc.exists) {
                  this.question = doc.data().question;
                } else {
                  console.log("No such document!");
                }
              });
            }, (error) => {
              console.log("Error fetching document:", error);
            });
          }
          

    }
});
app.use(vuetify).mount("#app");