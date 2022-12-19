/* eslint-disable */
// This file is based on FITSKeywords.js which has the following copyright notice:
// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FITSKeywords.js - Released 2020/04/17
// ****************************************************************************
//
// This file is part of FITSKeywords Script version 1.0.3
//
// Copyright (C) 2020 Dave Watson.
// Copyright (C) 2009 - 2020 Original author unknown.
// Written by Unknown
// Modified by Dave Watson
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");

const possibleLightPaths = ["Light", "lights" ];

module.exports.readKeywords = (basePath) => {
  const fileDirectory = possibleLightPaths.find(p => fs.existsSync(path.join(basePath, p)));
  if(!fileDirectory) {
    return [];
  }
  const filePath = path.join(basePath, fileDirectory);
  const files = fs.readdirSync(filePath);

  // console.log(files);
  const fitsFile = files.find(f => path.extname(f) === ".fits");
  if(!fitsFile) {
    return [];
  }
  // console.log(fitsFile);

  if(!fitsFile) {
    return [];
  }

  return readKeywordsFromFile(path.join(filePath, fitsFile));
}

module.exports.getNumericKeyword = (keywordName, keywords, roundToInteger = false) => {
  const keyword = keywords.find(k => k.keywordName === keywordName);
  if(!keyword) {
    return undefined;
  }

  return roundToInteger ? Math.round(Number(keyword.keywordValue)) : Number(keyword.keywordValue);
}

module.exports.readKeywordsFromFile = (filePath) => {
  if(!filePath || !path.basename(filePath).endsWith(".fits")) {
    return []
  }
  const buffer = fs.readFileSync(filePath);
  let keywordName = "";
  let offset = 0;

  const keywords = [];
  do {
    const rawKeyword = buffer.subarray(offset, offset + 80).toString();
    // console.log(rawKeyword)
    keywordName = rawKeyword.substring(0, 8).trim();
    if (keywordName.toUpperCase() === "END") {
      break;
    }
    let keywordValue = "";
    // Values will have an = at character 8. Hierarchical values are different and not supported.
    if (rawKeyword[8] === "=") {
      let commentIndex = searchCommentSeparator(rawKeyword);
      commentIndex = commentIndex >= 0 ? commentIndex : 79;
      // console.log(commentIndex);
      keywordValue = rawKeyword.substring(10, commentIndex - 1).replace(/'/g, "").trim();
    }

    keywords.push({ keywordName, keywordValue });
    offset += 80;
  } while (offset < buffer.length);

  return keywords;
}

function searchCommentSeparator(rawKeyword) {
  let inString = false;
  for (let i = 9; i < 79; ++i)
    switch (rawKeyword[i])
    {
      case "''": // single quote
        inString ^= true;
        break;
      case "/": // slash
        if (!inString) return i;
        break;
      }
  return -1;
}