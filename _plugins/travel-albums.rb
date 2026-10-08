require 'cgi'
require 'digest'

module TravelAlbums
  class Generator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      metadata = site.data['travel_albums'] || {}
      albums = Dir.glob(File.join(site.source, 'assets/pdf/travel/**/*')).select do |path|
        File.file?(path) && File.extname(path).downcase == '.pdf'
      end.sort.reverse.map do |path|
        relative = path.delete_prefix("#{site.source}/assets/pdf/travel/")
        key = relative.sub(/\.pdf\z/i, '')
        options = metadata.fetch(key, {})
        encoded_key = key.split('/').map { |part| CGI.escape(part).gsub('+', '%20') }.join('/')
        album = {
          'title' => File.basename(key).tr('_-', ' '),
          'description' => '',
          'lang' => 'zh',
          'pdf_cover' => true
        }.merge(options).merge(
          'id' => "book-#{Digest::SHA256.hexdigest(key)[0, 12]}",
          'url' => "/life/#book-#{Digest::SHA256.hexdigest(key)[0, 12]}",
          'pdf_url' => '/assets/pdf/travel/' + relative.split('/').map { |part| CGI.escape(part).gsub('+', '%20') }.join('/')
        )
        page = Jekyll::PageWithoutAFile.new(site, site.source, "travel/#{key}", 'index.html')
        page.data.merge!('layout' => 'none', 'title' => album['title'], 'sitemap' => false, 'permalink' => "/travel/#{encoded_key}/")
        page.content = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={{ ' + album['url'].inspect + ' | relative_url }}"></head><body><a href="{{ ' + album['url'].inspect + ' | relative_url }}">前往生活 · 行者之书</a></body></html>'
        site.pages << page
        album
      end
      site.data['generated_travel_albums'] = albums
    end
  end
end
