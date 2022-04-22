const express = require('express');
const router = express.Router();
const path = require('path');

//mongoose
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');

router.use(express.static(__dirname + '/../public')); //스태틱 폴더 지정

//보안 관련 미들웨어
const sanitize = require('sanitize-html');

router.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname + './../index.html'));
  //res.render('index2');
});



router.get('/adminPage/:pageNum', applicantController.getAllApplicants, (req, res, next) => {
  var ApplicantsData = req.data;
  ApplicantsData.reverse();
  //res.sendFile(path.resolve(__dirname + '/../views/adminPage.html'));
  res.render('index', {
    Applicants: ApplicantsData,
    title: "Mytitle",
    pageNum: req.params.pageNum,
  });
});

//몽구스 테스트
router.get('/applicants/:email',articleController.findArticle, (req, res, next)=>{

  console.log("req.data from findArticle");
  console.log(req.data);
  var ArticlesData = req.data;
  ArticlesData.reverse();


  res.render('index2', {
    Articles: ArticlesData,
    title: "Mytitle",
  });

});



module.exports = router;
