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
            showInformation: false,
            newQuestionAdded: false,
            addTeacherWarning: false,
            addTeacherSuccess: false,
            showQuizBox: false,
            showAddBox: false,
            showLogout: false,
            showDialog: false,
            alertType: '',
            user: null,
            userRole: '',
            checkin: [],
            newcheckin: { id: '', room: '', class_date: '', subject: '', question: '' },
            initialID: '',
            classID: '',
            students: [],
            studentFound: false,
            teacherFound: false,
            studentInfo: { id: '', sid: '', email: '', name: '', section: '', answer: '' },
            classInfo: { id: '', room: '', class_date: '', subject: '', question: '' },
            latestCheckin: { id: '' },
            newQuestion: { question: '', id: '' },
            latestQuestion: null,
            questionList: [],
            question: { question: '' },
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
        this.autoRead(this.classID);
        this.readQuestion(this.latestCheckin.id);

    },

    methods: {
        deleteData(std) {
            if (confirm("Are your sure you want to delete?")) {
                const studentID = std.id;
                const studentSID = std.sid;
                if (studentID && studentSID) {
                    db.collection("Students").where("id", "==", studentID).where("sid", "==", studentSID).get()
                        .then((querySnapshot) => {
                            querySnapshot.forEach((doc) => {
                                // ลบเอกสารนักเรียนที่พบ
                                doc.ref.delete()
                                    .then(() => {
                                        console.log("Document successfully deleted!");
                                        // ลบข้อมูลออกจากตารางนักเรียนหลังจากลบจากฐานข้อมูล
                                        this.students = this.students.filter(student => student.id !== studentID);
                                    })
                                    .catch((error) => {
                                        console.error("Error removing document: ", error);
                                    });
                            });
                        })
                        .catch((error) => {
                            console.error("Error checking student: ", error);
                        });
                } else {
                    console.error("Student ID or SID is missing.");
                }
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

        autoRead(id) {
            db.collection("Students").onSnapshot((studentSnapshot) => {
                var studentList = [];
                studentSnapshot.forEach((studentDoc) => {
                    const studentData = { id: studentDoc.id, ...studentDoc.data() };
                    const studentID = studentData.id;
                    if (studentID === id) {
                        studentList.push(studentData);
                    }
                });
                setTimeout(() => {
                    this.students = studentList;
                }, 1000);
            });
        },

        addTeacher() {
            this.showAddBox = false;
            if (!this.newcheckin.id) {
                this.newcheckin.id = this.generateRandomID();
            }
            if (this.newcheckin.room && this.newcheckin.class_date && this.newcheckin.subject && this.newcheckin.question) {
                db.collection("checkin").add(this.newcheckin)
                    .then((docRef) => {
                        db.collection("checkin").doc(docRef.id).get()
                            .then((doc) => {
                                if (doc.exists) {
                                    this.classID = this.generateRandomID();
                                    this.latestCheckin.id = this.generateRandomID();
                                    this.latestCheckin.room = this.newcheckin.room;
                                    this.latestCheckin.subject = this.newcheckin.subject;
                                    this.latestCheckin.class_date = this.newcheckin.class_date;
                                    this.latestCheckin.question = this.newcheckin.room;
                                    this.newcheckin = { id: '', room: '', class_date: '', subject: '', question: '' };
                                    this.fetchTeachers();
                                    this.addTeacherSuccess = true;
                                    alert('Add class successfully!');
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
                    id: this.newcheckin.id
                };

                db.collection("Students").add(newData)
                    .then(() => {
                        console.log("Student data added successfully!");
                        this.studentInfo = { id: '', sid: '', email: '', name: '', section: '', answer: '' };
                        this.fetchLatestStudentData();
                        this.students.push(newData);
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

        checkTeacher() {
            this.autoRead(this.classID);
            this.readQuestion(this.classInfo.id);
            const studentID = this.classID;
            if (studentID) {
                this.showInformation = true;
                db.collection("checkin").where("id", "==", studentID)
                    .get()
                    .then((querySnapshot) => {
                        if (!querySnapshot.empty) {
                            // alert('Student found.');
                            this.alertType = 'found';
                            // this.showDialog = true;

                            this.teacherFound = true;
                            this.classID = '';
                            querySnapshot.forEach((doc) => {
                                this.classInfo = doc.data();
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
        toggleAddBox() {
            this.classInfo = { id: '', room: '', class_date: '', subject: '', question: '' };
            this.showAddBox = !this.showAddBox;
        },
        confirmGoogleLogout() {
            this.showLogout = true;
        },
        logout() {
            firebase.auth().signOut();
            window.location.href = 'index.html';
        },

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
            db.collection("checkin").where("id", "==", id).onSnapshot((snapshot) => {
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
