require 'minitest/autorun'
require 'jekyll'
require_relative '../../_plugins/newsletter'

class NewsletterRendererTest < Minitest::Test
  Document = Struct.new(:output, :relative_path, :data, :url, :date, :collection)
  Collection = Struct.new(:label)

  def document(html, path = '_posts/test.md', language = 'zh')
    Document.new("<article><div id='markdown-content'>#{html}</div></article>", path,
                 { 'title' => 'Title <&>', 'lang' => language }, '/blog/test/', Time.utc(2026, 1, 1), Collection.new('posts'))
  end

  def test_rendered_content_links_images_code_and_unsubscribe
    post = document('<p>Hello <a href="../other/">world</a></p><picture><source srcset="/wrong.webp"><img src="/image.jpg" alt="A picture"></picture><pre><code>a &lt; b</code></pre><iframe src="https://example.com/video"></iframe><script>alert(1)</script>')
    mail = BlogNewsletter.message(post, 'https://www.ifuryst.com')
    html = Nokogiri::HTML(mail['html'])
    assert_equal 'https://www.ifuryst.com/blog/other/', html.at_css('a')['href']
    assert_equal 'https://www.ifuryst.com/image.jpg', html.at_css('img')['src']
    assert_empty html.css('script,iframe,picture,source')
    assert_includes html.at_css('pre')['style'], 'pre-wrap'
    assert_includes mail['html'], '{{{RESEND_UNSUBSCRIBE_URL}}}'
    assert_includes mail['text'], '(https://www.ifuryst.com/blog/other/)'
    assert_includes mail['text'], 'a < b'
    assert_equal 'Title <&>', html.at_css('h1').text
  end

  def test_identity_does_not_change_with_title_url_or_translation_pairing
    post = document('<p>Original</p>')
    first = BlogNewsletter.message(post, 'https://www.ifuryst.com')
    post.data['title'] = 'Edited'; post.data['translation_key'] = 'new-pair'; post.url = '/blog/renamed/'
    assert_equal first['id'], BlogNewsletter.message(post, 'https://www.ifuryst.com')['id']
    refute_equal first['id'], BlogNewsletter.message(document('<p>Translated</p>', '_en_posts/test.md', 'en'), 'https://www.ifuryst.com')['id']
  end

  def test_long_messages_keep_whole_blocks_and_link_to_original
    post = document('<p>' + '一段文字 ' * 10_000 + '</p><p>Last paragraph</p>')
    mail = BlogNewsletter.message(post, 'https://www.ifuryst.com')
    assert_operator mail['html'].bytesize, :<, 90_000
    assert_includes mail['html'], 'https://www.ifuryst.com/blog/test/'
    assert_includes mail['html'], '在博客阅读完整原文'
  end
end
