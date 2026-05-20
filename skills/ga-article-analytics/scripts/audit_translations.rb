#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"
require "date"

ROOT = File.expand_path("../../..", __dir__)

def frontmatter(path)
  text = File.read(path)
  match = text.match(/\A---\s*\n(.*?)\n---\s*\n/m)
  return {} unless match

  YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) || {}
rescue StandardError => e
  { "_error" => e.message }
end

def posts(glob)
  Dir[File.join(ROOT, glob)].map do |path|
    fm = frontmatter(path)
    [path.sub("#{ROOT}/", ""), fm]
  end
end

zh = posts("_posts/**/*.md")
en = posts("_en_posts/**/*.md")

zh_by_key = zh.select { |_path, fm| fm["translation_key"] }.group_by { |_path, fm| fm["translation_key"] }
en_by_key = en.select { |_path, fm| fm["translation_key"] }.group_by { |_path, fm| fm["translation_key"] }

missing_en = zh_by_key.keys.reject { |key| en_by_key.key?(key) }
missing_zh = en_by_key.keys.reject { |key| zh_by_key.key?(key) }
unpaired_zh = zh.reject { |_path, fm| fm["translation_key"] }

puts "zh_posts=#{zh.size} en_posts=#{en.size} zh_keys=#{zh_by_key.size} en_keys=#{en_by_key.size}"
puts "missing_en_count=#{missing_en.size}"
missing_en.sort.each do |key|
  path, fm = zh_by_key[key].first
  puts ["MISSING_EN", fm["date"], key, path, fm["title"]].join("\t")
end

puts "missing_zh_count=#{missing_zh.size}"
missing_zh.sort.each do |key|
  path, fm = en_by_key[key].first
  puts ["MISSING_ZH", fm["date"], key, path, fm["title"]].join("\t")
end

puts "unpaired_zh_count=#{unpaired_zh.size}"
unpaired_zh.sort_by { |_path, fm| fm["date"].to_s }.reverse.first(80).each do |path, fm|
  puts ["UNPAIRED_ZH", fm["date"], path, fm["title"]].join("\t")
end

puts "recent_zh"
zh.sort_by { |_path, fm| fm["date"].to_s }.reverse.first(40).each do |path, fm|
  key = fm["translation_key"]
  has_en = key && en_by_key.key?(key)
  puts ["RECENT_ZH", fm["date"], key, has_en, path, fm["title"]].join("\t")
end
