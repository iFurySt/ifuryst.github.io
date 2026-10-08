# Run with: bundle exec ruby .github/scripts/check-travel-albums.rb
require 'jekyll'
require 'tmpdir'
require 'fileutils'
require 'yaml'
require_relative '../../_plugins/travel-albums'

Dir.mktmpdir('travel-albums-') do |source|
  destination = File.join(source, '_site')
  pdf_dir = File.join(source, 'assets/pdf/travel')
  FileUtils.mkdir_p([File.join(pdf_dir, '子目录'), File.join(source, '_layouts'), File.join(source, '_data'), File.join(source, '_includes')])
  # Only discovery and routing are under test; PDF rendering is checked in a browser.
  File.write(File.join(pdf_dir, '2026-trip.pdf'), '%PDF-1.4')
  File.write(File.join(pdf_dir, '子目录/中文 空格.PDF'), '%PDF-1.4')
  File.write(File.join(pdf_dir, 'README.md'), 'Not an album')
  File.write(File.join(source, '_layouts/none.html'), '{{ content }}')
  File.write(File.join(source, '_layouts/default.html'), '{{ content }}')
  FileUtils.cp(File.expand_path('../../_layouts/life.liquid', __dir__), File.join(source, '_layouts'))
  FileUtils.cp(File.expand_path('../../_includes/travel-book.liquid', __dir__), File.join(source, '_includes'))
  File.write(File.join(source, 'life.html'), "---\nlayout: life\nlang: zh\npermalink: /life/\n---\n{% for album in site.data.generated_travel_albums %}{% include travel-book.liquid album=album %}{% endfor %}")
  File.write(File.join(source, '_data/travel_albums.yml'), {
    '2026-trip' => { 'title' => '旅行手记', 'description' => '测试简介', 'pdf_cover' => false }
  }.to_yaml)
  site = Jekyll::Site.new(Jekyll.configuration(
    'source' => source, 'destination' => destination, 'baseurl' => '/preview',
    'plugins' => [], 'quiet' => true
  ))
  site.process
  albums = site.data.fetch('generated_travel_albums')
  raise 'PDF discovery failed' unless albums.size == 2
  html = File.read(File.join(destination, 'travel/2026-trip/index.html'))
  raise 'Old URL redirect failed' unless html.include?('/preview/life/#book-')
  life = File.read(File.join(destination, 'life/index.html'))
  raise 'Metadata or embedded baseurl failed' unless life.include?('旅行手记') && life.include?('/preview/assets/pdf/travel/2026-trip.pdf') && life.include?('data-cover="false"')
  raise 'Multiple embedded books failed' unless life.scan('class="pdf-reader"').size == 2
  unicode = albums.find { |album| album['title'] == '中文 空格' }
  raise 'Unicode URL encoding failed' unless unicode && unicode['pdf_url'].include?('%20') && unicode['pdf_url'].end_with?('.PDF')
  raise 'Unicode output failed' unless File.file?(File.join(destination, 'travel/子目录/中文 空格/index.html'))

  File.delete(File.join(pdf_dir, '2026-trip.pdf'))
  site.process
  raise 'Deleted PDF still listed' unless site.data.fetch('generated_travel_albums').size == 1
  raise 'Deleted reader still published' if File.exist?(File.join(destination, 'travel/2026-trip/index.html'))

  File.delete(File.join(pdf_dir, '子目录/中文 空格.PDF'))
  site.process
  raise 'Empty library failed' unless site.data.fetch('generated_travel_albums').empty?
  empty_life = File.read(File.join(destination, 'life/index.html'))
  raise 'Empty library still shows book section' if empty_life.include?('行者之书') || empty_life.include?('pdf-reader') || empty_life.include?('travel-albums.js')
end

puts 'Travel albums: discovery, metadata, Unicode paths, baseurl, deletion and empty library passed.'
