<?php

class AnalysisKeyword
{
    function __construct()
    {
    }

//    public function analysisKeyword($data)
//    {
//
//        $txt='';
//        foreach($data['commentList'] as $comment){
//            $txt.= $comment['textDisplay'];
//        }
//
//        $mecab = new MeCab_Tagger();
//        $meisi = array();    //名詞配列
//        $word = '';            //複合名詞保存用バッファ変数
//
//        $word_list_index = $word_list = array();
//
//        for ($node = $mecab->parseToNode($txt); $node; $node = $node->getNext()) {
//            if ($node->getStat() != 2 && $node->getStat() != 3 && mb_strpos($node->getFeature(), '名詞', NULL, 'utf-8') === 0) {
//                $word .= $node->getSurface();
//
//                $key = array_search($word, $word_list_index);
//                if ($key === false) {// 新出
//                    $word_list[] = array('count' => 1, 'word' => $word);
//                    $word_list_index[] = $word;
//                } else {// 既出
//                    $word_list[$key]['count'] = $word_list[$key]['count'] + 1;
//                }
//
//            } else if ($word != '') {
//                array_push($meisi, $word);
//                $word = '';
//            }
//        }
//
//        unset($word_list_index);
//        arsort($word_list);
//
//        $data['analysisKeywordList'] = $word_list;
//
//        return $data;
//    }


    /**
     * キーワードを解析する
     *
     * @param  $bodyKeywordData
     *
     * @return array
     */
    public function analysisKeyword($data)
    {

        $txt='';
        foreach($data['commentList'] as $comment){
            $txt.= $comment['textDisplay'];
        }


        $outputs = array_reverse(preg_split("/EOS|\n/u", shell_exec(sprintf('echo %s | /usr/local/bin/juman', escapeshellarg($txt)))));

        // 各品詞を抽出
        $allKeywordList = [];    //名詞配列
        foreach ($outputs as $output) {
            if (
                preg_match('/名詞/', $output)
                || preg_match('/動詞/', $output)
                || preg_match('/形容詞/', $output)

            ) {
                $chars = preg_split('/ /', $output, -1, PREG_SPLIT_OFFSET_CAPTURE);
                $allKeywordList[] = $chars[0][0];
            }
        }

        $word_list = [];
        $word_list_index = [];

        foreach ($allKeywordList as $meisi) {
            $key = array_search($meisi, $word_list_index);
            if ($key === false) {// 新出
                if ($meisi == '@') {
                    continue;
                }
                $word_list[] = ['count' => 1, 'word' => $meisi];
                $word_list_index[] = $meisi;
            } else {// 既出
                $word_list[$key]['count'] = $word_list[$key]['count'] + 1;
            }
        }

        // ネガポジ分析
//        $results = $this->analysisNegaPoji($word_list_index, $results);

//        unset($word_list_index);
        arsort($word_list);

//        $results['wordList'] = array_slice($word_list, 0, 10);

        $data['analysisKeywordList'] = $word_list;

        return $data;
    }
}