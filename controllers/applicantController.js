const Applicant = require('./../models/applicant');
const passport = require('passport');
const crypto = require('crypto');
//mongoose
const articleController = require('./../controllers/articleController');
const s3Controller = require('./../controllers/s3Controller');
const nodemailerController = require('./../controllers/nodemailerController');

exports.getAllApplicants = (req, res, next) => {
  Applicant.find({}, (error, applicants) => {
    if (error) {
      console.log(err);
    } else {
      req.applicantsData = applicants;
      next();
    }
  });
};

exports.findApplicantById = async (req, res, applicantId)=>{
  console.log('findapplicantbyid');
  await Applicant.findById(applicantId, (error, applicant)=>{
    if (error) {
      console.log('applicant not found');
      console.log(error);
    } else {
      console.log('applicant found');
      req.applicantsData = applicant;
    }
  });
};

//email로 사용자 검색
exports.findApplicant = (req, res, next) => {
  //params, body 양쪽으로 들어와도 검색 가능
  console.log(req.body);
  let targetEmail;
  if (req.params.username != undefined) {
    targetEmail = req.params.username;
  } else if (req.body.username != undefined) {
    targetEmail = req.body.username;
  } else {
    console.log("no email found");
    next();
  }
  Applicant.find({
    username: targetEmail
  }, (error, applicant) => {
    if (error) {
      console.log(error);
    } else {
      req.applicantsData = applicant;
      next();
    }
  });
};

exports.verifyApplicant = (req, res, verifyKey) => {
  Applicant.find({verifyKey: verifyKey}, (error, applicant)=>{
    console.log('found applicant by verifyKey');
    console.log(applicant);
    if (error){
      console.log('error at finding applicant by verifyKey');
      res.render('errorPage', {
        errorDetail: '인증 코드에 해당하는 아이디를 찾지 못했습니다'
      });
    }
    else{
      applicant = applicant[0];
      if (applicant == undefined){
        res.render('errorPage', {
          errorDetail: '인증 코드에 해당하는 아이디를 찾지 못했습니다',
        });
      }
      else{
        applicant.isVerified = true;
        applicant.save();
        res.redirect('/');
      }


    }
  });
};

exports.checkVerify = (req, res, applicantId) => {

};

exports.deleteApplicant = (req, res, applicantId) => {
  //console.log('사용자 삭제 시도');
  Applicant.findById(applicantId, async (error, applicant) => {
    if (error) {
      console.log(error);
    } else {
      console.log('사용자 삭제');
      //연결된 게시글 모두 삭제
      for (var i = 0; i < applicant.articles.length; i++) {
        //console.log("for 게시글 삭제");
        await articleController.deleteArticle(req, res, applicant.articles[i]);
        console.log(applicant.articles.length);
      }
      //썸네일 파일 삭제
      s3Controller.s3Delete(req, res, applicant.file);
      s3Controller.s3Delete(req, res, applicant.portfolio);
      //유저 삭제
      Applicant.deleteOne({
        _id: applicant._id
      }, (error, result) => {
        console.log('applicant.deleteOne');
        if (error) {
          console.log('error at deleteApplicant');
          console.log(error);
        } else {
          //console.log('유저 삭제 성공');
        }
      });
    }
  });
};

//사용자 정보 수정 어떻게 할 것인지 고민
exports.updateApplicant = (req, res) => {

};


exports.createApplicant = (req, res) => {

  let newApplicant = new Applicant({
    username: req.body.username,
    realname: req.body.realname,
    position: '그림작가',
    route: req.body.route,
    file: req.files[0].filename,
    portfolio: req.files[1].filename,
    createDate: new Date().getTime(),
    updateDate: new Date().getTime(),
    url: req.body.url,
    isAdmin: false,
    isVerified: true,
    verifyKey: crypto.randomBytes(16).toString('hex'),
    articles: new Array(0),
    tagInfo: new Array(0),
    categories: ['illustrator'],
  });

  Applicant.register(newApplicant, req.body.password, (error, applicant) => {
    if (error) {
      console.log('error while user register!', error);
    } else {
      //console.log("createApplicant success");
      //s3에 썸네일 이미지, 포트폴리오 파일 업로드
      s3Controller.s3Upload(req, res, req.files[0].filename);
      s3Controller.s3Upload(req, res, req.files[1].filename);
      //verify code 전송
      console.log('created key');
      console.log(applicant.verifyKey);
      nodemailerController.sendVerificationMail(req, res, applicant.username, applicant.verifyKey);
      //기본 게시글 생성
      articleController.articleInit(req, res, applicant._id);
      //바로 로그인
      passport.authenticate("local")(req, res, () => {
        console.log("registered and logged in as: ");
        console.log(req.user);
      });
    }

  });

};
