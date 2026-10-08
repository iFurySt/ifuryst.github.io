# Generate mail from Jekyll's rendered article body, after Liquid and Markdown.
require 'json'
require 'digest'
require 'fileutils'
require 'uri'
require 'cgi'
require 'nokogiri'

module BlogNewsletter
  MAX_BODY_BYTES = 65_000
  STYLES = {
    'p' => 'margin:0 0 16px;',
    'h1' => 'font-size:26px;line-height:1.35;margin:28px 0 16px;',
    'h2' => 'font-size:23px;line-height:1.4;margin:26px 0 14px;',
    'h3,h4,h5,h6' => 'font-size:19px;line-height:1.4;margin:22px 0 12px;',
    'img' => 'max-width:100%;height:auto;display:block;margin:16px 0;',
    'pre' => 'white-space:pre-wrap;overflow-wrap:anywhere;padding:14px;background:#f3f4f6;font:13px/1.6 monospace;border-radius:6px;',
    'code' => 'font-family:monospace;overflow-wrap:anywhere;',
    'blockquote' => 'margin:18px 0;padding:0 16px;border-left:3px solid #ccc;color:#555;',
    'table' => 'width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;',
    'td,th' => 'border:1px solid #ddd;padding:8px;text-align:left;',
    'a' => 'color:#087f8c;text-decoration:underline;',
    'figure' => 'margin:16px 0;',
    'figcaption' => 'font-size:14px;color:#666;'
  }.freeze

  def self.absolute(value, base)
    URI.join(base, value).to_s
  rescue URI::InvalidURIError
    ''
  end

  def self.render(document, base)
    page = Nokogiri::HTML(document.output)
    article = page.at_css('#markdown-content') || page.at_css('d-article') || page.at_css('.post-content')
    raise "Missing rendered article body: #{document.relative_path}" unless article

    body = Nokogiri::HTML::DocumentFragment.parse(article.inner_html)
    body.css('script,style,link,form,input,button,d-contents,nav').remove
    body.css('iframe,video,audio').each do |media|
      source = media['src'] || media.at_css('source')&.[]('src')
      href = source ? absolute(source, base) : base
      replacement = Nokogiri::XML::Node.new('a', body.document)
      replacement['href'] = href
      replacement.content = source || base
      media.replace(replacement)
    end
    body.css('picture').each do |picture|
      image = picture.at_css('img')
      image ? picture.replace(image.dup) : picture.remove
    end
    body.css('source').remove
    body.css('a[href],img[src]').each do |node|
      attribute = node.name == 'a' ? 'href' : 'src'
      value = node[attribute].to_s
      if value.start_with?('#')
        node[attribute] = "#{base}#{value}"
      elsif value.match?(/\A(?:https?:|mailto:|tel:)/i) || !value.match?(/\A[a-z][a-z0-9+.-]*:/i)
        node[attribute] = absolute(value, base)
      else
        node.remove_attribute(attribute)
      end
    end
    body.css('*').each do |node|
      node.attribute_nodes.each do |attribute|
        node.remove_attribute(attribute.name) unless %w[href src alt title colspan rowspan].include?(attribute.name)
      end
    end
    STYLES.each { |selector, style| body.css(selector).each { |node| node['style'] = style } }
    # Long articles retain complete top-level blocks; the footer links to the full original.
    limited = Nokogiri::HTML::DocumentFragment.parse('')
    body.children.each do |node|
      break if (limited.to_html.bytesize + node.to_html.bytesize) > MAX_BODY_BYTES
      limited.add_child(node.dup)
    end
    limited
  end

  def self.message(document, site_url)
    language = document.data['lang'] || (document.collection.label == 'en_posts' ? 'en' : 'zh')
    return unless %w[zh en].include?(language)
    # File identity stays stable when a title, slug, URL, or translation pairing is edited.
    id = Digest::SHA256.hexdigest("#{document.relative_path}:#{language}")
    url = absolute(document.url, "#{site_url}/")
    article = render(document, url)
    title = document.data['title'].to_s
    read = language == 'en' ? 'Read the complete article on the blog' : '在博客阅读完整原文'
    unsubscribe = language == 'en' ? 'Unsubscribe' : '退订'
    footer = "<hr style=\"border:0;border-top:1px solid #ddd;margin:28px 0\"><p><a href=\"#{CGI.escapeHTML(url)}\">#{read}</a></p><p style=\"font-size:13px;color:#666\">ifuryst · <a href=\"{{{RESEND_UNSUBSCRIBE_URL}}}\">#{unsubscribe}</a></p>"
    body = "<!doctype html><html lang=\"#{language}\"><meta charset=\"utf-8\"><body style=\"margin:0;background:#fff;color:#222\"><div style=\"max-width:640px;margin:0 auto;padding:24px;font:16px/1.8 Arial,sans-serif\"><h1 style=\"font-size:28px;line-height:1.4\">#{CGI.escapeHTML(title)}</h1>#{article.to_html}#{footer}</div></body></html>"
    plain = article.dup
    plain.css('a').each { |anchor| anchor.content = "#{anchor.text} (#{anchor['href']})" }
    plain.css('img').each { |image| image.replace("\n#{image['alt']} (#{image['src']})\n") }
    plain.css('br').each { |node| node.replace("\n") }
    plain.css('p,h1,h2,h3,h4,li,pre,blockquote,tr').each { |node| node.add_next_sibling("\n\n") }
    {
      'id' => id, 'language' => language, 'title' => title,
      'published_at' => document.date.iso8601, 'url' => url, 'html' => body,
      'text' => "#{title}\n\n#{plain.text}\n\n#{read}: #{url}\n#{unsubscribe}: {{{RESEND_UNSUBSCRIBE_URL}}}"
    }
  end

  def self.write(site)
    config = site.config['newsletter'] || {}
    return unless config['provider'] == 'resend'
    site_url = config.fetch('site_url', 'https://www.ifuryst.com').sub(%r{/+$}, '')
    documents = site.posts.docs + (site.collections['en_posts']&.docs || [])
    entries = []
    directory = File.join(site.dest, 'newsletter', 'messages')
    FileUtils.mkdir_p(directory)
    documents.sort_by(&:date).each do |document|
      next if document.data['newsletter'] == false || document.data['external_source'] || document.data['published'] == false
      next if document.date > site.time && !site.config['future']
      message = message(document, site_url)
      next unless message
      File.write(File.join(directory, "#{message['id']}.json"), JSON.generate(message))
      entries << message.reject { |key, _| %w[html text].include?(key) }
    end
    File.write(File.join(site.dest, 'newsletter', 'index.json'), JSON.generate({ 'version' => 1, 'entries' => entries }))
    Jekyll.logger.info 'Newsletter:', "rendered #{entries.length} email versions"
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  BlogNewsletter.write(site)
end
