// ==UserScript==
// @name         nCore - makeup
// @namespace    https://github.com/Victoare/ncore-makeup
// @version      0.5.4
// @description  Ncore púder és szájfény
// @author       Victoare
// @match        https://ncore.pro/torrents.php*
// @downloadURL  https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js
// @updateURL    https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ===========================================================================================
  // CSS overload
  // ===========================================================================================

  // extract theme from stylesheet path     <link rel="stylesheet" href="https://static.ncore.pro/styles/default2/style_sslv11.css" type="text/css">
  var theme = $('link[rel="stylesheet"][href^="https://static.ncore.pro/styles/"]').attr('href').match(/\/styles\/([^\/]*)\/style_/)[1];
  $('body').addClass('theme_' + theme);

  var qs = (new URL(document.location)).searchParams; // https://ncore.pro/torrents.php?miszerint=name&hogyan=DESC&tipus=hd_hun&mire=202&miben=name
  var qsOrderBy   = qs.get("miszerint");
  var qsOrderDesc = qs.get("hogyan") != 'ASC';
  var specOrder   = (!qsOrderBy || qsOrderBy=='fid') && qsOrderDesc; //dátum szerint, csökkenő, de csoporton belül a legrégebbi dátum szerint, így előre kerülnek az új feltöltések

  // overload some styles
  var myStyle = document.createElement('style');
  document.head.appendChild(myStyle);
  var cssMod = myStyle.sheet;

  cssMod.insertRule('.ajaxGetOtherVersions { cursor: pointer; float: right; border: 1px solid #838383; padding: 2px; background-color: #3c869a; font-weight: bold; }');

  // table header
  cssMod.insertRule('.box_borito { width: 164px; }');
  cssMod.insertRule('.box_nev    { width: 343px; }');

  // table items
  cssMod.insertRule('.box_borito_img     { width: 182px; border: 1px solid #828282; float: left; margin-top: 1px; min-height: 32px; text-align: center;}');
  cssMod.insertRule('.box_borito_img img { width: 182px; }');
  cssMod.insertRule('.box_nev2           { width: 358px; height: 32px; }');
  cssMod.insertRule('.box_nagy, .box_nagy2 { width: 659px; float: right; }');
  cssMod.insertRule('.box_nagy.imdbinfo, .box_nagy2.imdbinfo { width:701px; padding:6px; height:auto; }');
  cssMod.insertRule('.torrent_txt, .torrent_txt2      { text-overflow: ellipsis; width: 293px; overflow:hidden;}'); //313px for single icon, 293 for double
  cssMod.insertRule('.torrent_txt a, .torrent_txt2 a  { text-overflow: ellipsis; }');
  cssMod.insertRule('.box_borito         { width: 164px; }');
  cssMod.insertRule('.box_nev            { width: 255px; }');
  cssMod.insertRule('.box_alap_img       { float: right; }');
  cssMod.insertRule('.box_torrent_all    { width: 900px; }');

  cssMod.insertRule('.torrent_lenyilo, .torrent_lenyilo2 { width: 715px; float: right; }');
  cssMod.insertRule('.torrent_lenyilo_lehetoseg { width: 715px; }');
  cssMod.insertRule('.torrent_lenyilo  .torrent_lenyilo_tartalom  { width: 693px; }');
  cssMod.insertRule('.torrent_lenyilo2 .torrent_lenyilo_tartalom  { width: 693px; }');
  cssMod.insertRule('.torrent_leiras { width: 666px; }');
  cssMod.insertRule('.hr_stuff       { width: 693px; }');

  cssMod.insertRule('.torrent_lenyilo_tartalom .banner { zoom: 50%; }');

  // theme specific overrides
  cssMod.insertRule('.theme_brutecore .box_nagy, .theme_brutecore .box_nagy2 { width: 650px; padding-left: 0; }');
  cssMod.insertRule('.theme_brutecore .box_alap_img { position: inherit; }');
  cssMod.insertRule('.theme_brutecore .torrent_lenyilo_lehetoseg { width: 700px; }');
  cssMod.insertRule('.theme_brutecore .torrent_konyvjelzo2 { margin: 16px 5px 0 0; }');

  // ===========================================================================================
  // Modify table header, Add cover, remove uploader column
  // ===========================================================================================

  $('.box_alcimek_all').prepend(`
      <div class="box_alap">
        <table class="alcim"><tbody><tr>
          <td><div class="alcim_bal"></div></td>
          <td><div class="box_borito">Borító</div></td>
          <td><div class="alcim_jobb"></div></td>
        </tr></tbody></table>
      </div>
    `);

  $('.box_alcimek_all .box_alap_utolso').remove();
  $('.box_alcimek_all .box_alap:last').removeClass('box_alap').addClass('box_alap_utolso');
  $('.box_torrent_all .box_feltolto2').remove();

  // ===========================================================================================
  // Extract torrent info, detach originals from GUI
  // ===========================================================================================

  var torrents = [];
  $('.box_torrent_all>div[style="clear:both;"]').remove();
  var $rowDivs = $('.box_torrent_all>div');

  var getImdbID = function ($row) {
    var attr = $row.find('.infolink').attr('href');
    if(!attr) return '';
    var match = attr.match(/\/(ev\d{7}\/\d{4}(-\d)?|(ch|co|ev|nm|tt)\d{7,})/i);
    if(!(match && match.length)) return '';
    return match[1];
  }
  var getCoverImg = function ($row) {
    var attr = $row.find('img.infobar_ico').attr('onmouseover');
    return attr ? attr.match(/'([^']*)'/)[1] : '';
  }
  var getTorrentId = function ($row) {
    var attr = $row.find('a[onclick^="torrent("]').attr('onclick');
    return attr ? attr.match(/\((\d*)\)/)[1] : '';
  }
  var getUploadDate = function ($row) {
    var val = $row.find('.box_feltoltve2').html()
    var p = val.split(/-|<br>|:/g).map((n)=>parseInt(n,10));
    return new Date(p[0], p[1]-1, p[2], p[3], p[4], p[5]).getTime() / 1000; // unix timestamp like 1649433945
  }

  for (var i = 0; i < $rowDivs.length - 1; i += 2) {
    var $mainRow = $($rowDivs[i]);
    torrents.push({
      imdbId: getImdbID($mainRow),
      torrentId: getTorrentId($mainRow),
      coverImg: getCoverImg($mainRow),
      uploaded: getUploadDate($mainRow),
      $mainRow: $mainRow,      // .box_torrent
      detailRow: $rowDivs[i + 1], // .torrent_lenyilo v. .torrent_lenyilo2
    });
  }

  $rowDivs.detach();

  // ===========================================================================================
  // Rebuild table using IMDB ID if available
  // ===========================================================================================

  // Distinct IMDB ids
  var distinct = function (arr) {
    var ret = [];
    for (var i = 0; i < arr.length; i++)
      if (ret.indexOf(arr[i]) == -1) ret.push(arr[i]);
    return ret;
  }

  var idList = distinct(torrents.map(function (t) { return t.imdbId; }));

  if(specOrder){
      var newestFirst = (d1, d2) => (d1 > d2)?-1:(d1 < d2)?1:0;
      var oldestFirst = (t1, t2) => newestFirst(t1.uploaded, t2.uploaded)*-1;
      var byImdbId = (id)=>(t)=>t.imdbId==id;
      idList.sort((a,b)=>{
          var a_minDate = torrents.filter(byImdbId(a)).sort(oldestFirst)[0].uploaded;
          var b_minDate = torrents.filter(byImdbId(b)).sort(oldestFirst)[0].uploaded;
          return newestFirst(a_minDate, b_minDate);
      });
  }

  //re-populate list
  for (var i = 0; i < idList.length; i++) {
    var html = [];
    var $siterank = null;
    var noId = idList[i] == '';
    var firstTorrentData = null;
    for (var j = 0; j < torrents.length; j++) {
      if (torrents[j].imdbId == idList[i]) {
        var $mainRow = torrents[j].$mainRow;
        if (html.length == 0 || noId) {
            if(noId){
                html.push(`<div class="box_borito_img"></div>`);
            }else{
                var src = torrents[j].coverImg;
                if(!src){
                    var imgs = torrents.filter((t)=>t.imdbId==idList[i] && t.coverImg).map((t)=>t.coverImg);
                    if(imgs.length) src = imgs[0];
                }
                html.push(`<div class="box_borito_img" id="borito_img_${torrents[j].imdbId}">${(src ? '<img src="' + src + '">' : '')}</div>`);
            }
        }
        if (firstTorrentData == null) firstTorrentData = torrents[j];
        if (!$siterank) $siterank = $mainRow.find('.siterank');
        if (torrents[j].coverImg) $mainRow.find('.infobar').remove();
        if (!noId) $mainRow.find('.siterank').remove();

        if (!$mainRow.find('.torrent_txt_also').html()) {
          $mainRow.find('.torrent_txt_also').remove();
          $mainRow.find('.torrent_txt').removeClass('torrent_txt').addClass('torrent_txt2');
        }

        $mainRow.find('nobr').text($mainRow.find('a').attr('title')); //replace shortend text with proper one

        if(!noId && torrents[j].coverImg){
          $mainRow.attr('onmouseover', `$('#borito_img_${torrents[j].imdbId} img').attr('src', '${torrents[j].coverImg}')`);
        }

        html.push($mainRow);
        html.push(torrents[j].detailRow);

        if (noId) {
          html.push('<div style="clear:both;"></div>');
        }
      }
    }
    if (!noId) {
      if ($siterank) {
        var $infoBar = $('<div class="box_nagy imdbinfo">');
        $siterank.find('span:first').text($siterank.find('span:first').attr('title'));
        $infoBar.append($siterank);
        $infoBar.append($('<div class="ajaxGetOtherVersions">Más verziók keresése</div>').click(
          (function (ftd, $ib) { return function () { GetDetails(ftd, $ib); } })(firstTorrentData, $infoBar)
        ));
        html.push($infoBar);
        //html.push('<div class="box_nagy imdbinfo">' + $siterank.html() + '<div class="ajaxGetOtherVersions" data-ftidx="' + firstTorrentIdx + '">Más verziók lekérdezése</div></div>');
      }
      html.push('<div style="clear:both;"></div>');
    }
    $('.box_torrent_all').append(html);
  }

  $('.box_torrent_all .ajaxGetOtherVersions').each(function (idx, itm) { });
  $(html).find('.ajaxGetOtherVersions').click((function (ftd) { return function () { GetDetails(ftd); } })(firstTorrentData));

  // change order of divs because of float:right
  $('.box_torrent_all .box_torrent').each(function () {
    $(this).prepend($(this).find('>div:last'));
  });

  reArrangeOddEvenClasses();

  // ===========================================================================================
  // Functions to call
  // ===========================================================================================

  // rearrange odd/even row styles
  function reArrangeOddEvenClasses() {
    $('.box_torrent_all .box_nagy, .box_torrent_all .box_nagy2').each(function (idx, item) { $(item).toggleClass('box_nagy', idx % 2 == 0).toggleClass('box_nagy2', idx % 2 == 1) });
    $('.box_torrent_all .torrent_lenyilo, .box_torrent_all .torrent_lenyilo2').each(function (idx, item) { $(item).toggleClass('torrent_lenyilo', idx % 2 == 1).toggleClass('torrent_lenyilo2', idx % 2 == 0) });
  }

  function GetDetails(torrentData, $infoBar) {
    var id = torrentData.imdbId.substr(2); // remove "tt" from the id
    var torrentsOnScreen = distinct($('.box_torrent_all a[href^="torrents.php?action=details&id="]').map(function () { return $(this).attr('href').match(/id=(\d+)/)[1] }));
    $infoBar.find('.ajaxGetOtherVersions').html('<img src="https://static.ncore.pro/styles/ajax.gif">');
    $.get("ajax.php?action=other_versions&id=" + id + "&fid=" + torrentData.torrentId + "&details=1")
      .fail(function () {
        $infoBar.find('.ajaxGetOtherVersions').html('Más verziók keresése');
      })
      .done(function (data) {
        var $data = $(data);
        var html = $data.find('.box_torrent_mini2').map(function () {
          var $itm = $(this);
          var torrentID = $itm.find('a[href^="torrents.php?action=details&id="]').attr('href').match(/id=(\d+)/)[1];
          if (torrentsOnScreen.indexOf(torrentID) > -1) return '';
          var title = $itm.find('.box_txt_ownfree a').attr('title');
          return `<div class="box_torrent">
                      <div class="box_nagy2">
                        <div class="box_nev2">
                          <div class="tabla_szoveg">
                            <div style="cursor:pointer" onclick="konyvjelzo('${torrentID}');" class="torrent_konyvjelzo2"></div>
                            <div class="torrent_txt2">
                              <a href="torrents.php?action=details&amp;id=${torrentID}" onclick="torrent(${torrentID}); return false;" title="${title}"><nobr>${title}</nobr></a>
                            </div>
                          </div>
                        </div>
                        <div class="users_box_sepa"></div>
                        <div class="box_feltoltve2">${$itm.find('.box_feltoltve_other_short').html()}</div>
                        <div class="users_box_sepa"></div>
                        <div class="box_meret2">${$itm.find('.box_meret2').html()}</div>
                        <div class="users_box_sepa"></div>
                        <div class="box_d2">${$itm.find('.box_d2').html()}</div>
                        <div class="users_box_sepa"></div>
                        <div class="box_s2">${$itm.find('.box_s2').html()}</div>
                        <div class="users_box_sepa"></div>
                        <div class="box_l2">${$itm.find('.box_l2').html()}</div>
                        <div class="users_box_sepa"></div>
                      </div>
                      <div class="box_alap_img">
                        ${$itm.find('.box_alap_img').html()}
                      </div>
                    </div>
                    <div class="torrent_lenyilo" style="display:none;" id="${torrentID}"></div>`;
        });
        $(html.get().join('')).insertBefore($infoBar);
        $infoBar.find('.ajaxGetOtherVersions').remove();
        reArrangeOddEvenClasses();
      });
  }
})();
