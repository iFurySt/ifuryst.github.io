#!/usr/bin/env ruby

require "digest"
require "fileutils"
require "json"
require "open3"
require "shellwords"
require "yaml"

SOURCE_ROOT = Dir.pwd
SITE_ROOT = File.join(SOURCE_ROOT, "_site")
CACHE_ROOT = File.join(SOURCE_ROOT, ".responsive-image-cache")
MANIFEST_PATH = File.join(CACHE_ROOT, "manifest.json")

config = YAML.load_file(File.join(SOURCE_ROOT, "_config.yml")).fetch("imagemagick")
widths = config.fetch("widths")
input_directories = config.fetch("input_directories")
input_formats = config.fetch("input_formats").map { |format| format.downcase }
output_formats = config.fetch("output_formats")
resize_flags = Shellwords.split(config.fetch("resize_flags", "").to_s)
exclude_patterns = config.fetch("exclude", [])

FileUtils.mkdir_p(CACHE_ROOT)
manifest = if File.file?(MANIFEST_PATH)
  JSON.parse(File.read(MANIFEST_PATH))
else
  { "version" => 1, "sources" => {} }
end

def relative_path(path)
  path.delete_prefix("#{SOURCE_ROOT}/")
end

def excluded?(relative_path, patterns)
  patterns.any? do |pattern|
    relative_path == pattern ||
      relative_path.start_with?("#{pattern.delete_suffix("/")}/") ||
      File.fnmatch?(pattern, relative_path)
  end
end

def convert_image(source, output, flags, edge, resize_flags)
  abort "ImageMagick convert is required to generate #{relative_path(output)}" unless system("command -v convert >/dev/null 2>&1")

  FileUtils.mkdir_p(File.dirname(output))
  command = ["convert", source] + Shellwords.split(flags.to_s)
  command += ["-resize", "#{edge}>"] + resize_flags unless edge.to_i.zero?
  command << output

  _stdout, stderr, status = Open3.capture3(*command)
  return if status.success?

  abort "Failed to generate #{relative_path(output)}: #{stderr.strip}"
end

source_files = input_directories.flat_map do |directory|
  Dir[File.join(SOURCE_ROOT, directory, "**", "*")].select do |path|
    File.file?(path) && input_formats.include?(File.extname(path).downcase)
  end
end.sort

new_manifest = { "version" => 1, "sources" => {} }
expected_outputs = {}
generated = 0
reused = 0

source_files.each do |source|
  source_relative = relative_path(source)
  next if excluded?(source_relative, exclude_patterns)

  source_hash = Digest::SHA256.file(source).hexdigest
  previous_entry = manifest.fetch("sources", {})[source_relative]
  previous_hash = previous_entry && previous_entry["sha256"]
  outputs = []
  site_source = File.join(SITE_ROOT, source_relative)

  if previous_hash != source_hash || !File.file?(site_source)
    FileUtils.mkdir_p(File.dirname(site_source))
    FileUtils.cp(source, site_source, preserve: true)
  end

  output_formats.each do |format, flags|
    widths.each do |edge|
      extension = File.extname(source)
      source_directory = File.dirname(source_relative)
      suffix = edge.to_i.zero? ? "" : "-#{edge}"
      output_relative = File.join(source_directory, "#{File.basename(source, extension)}#{suffix}.#{format}")
      cache_output = File.join(CACHE_ROOT, output_relative)
      site_output = File.join(SITE_ROOT, output_relative)
      outputs << output_relative
      expected_outputs[output_relative] = true

      if previous_hash == source_hash && File.file?(cache_output)
        FileUtils.mkdir_p(File.dirname(site_output))
        FileUtils.cp(cache_output, site_output, preserve: true)
        reused += 1
        next
      end

      convert_image(source, cache_output, flags, edge, resize_flags)
      FileUtils.mkdir_p(File.dirname(site_output))
      FileUtils.cp(cache_output, site_output, preserve: true)
      generated += 1
    end
  end

  new_manifest["sources"][source_relative] = {
    "sha256" => source_hash,
    "outputs" => outputs,
  }
end

output_extensions = output_formats.keys.map { |format| ".#{format}" }
Dir[File.join(CACHE_ROOT, "assets", "img", "**", "*")].each do |path|
  next unless File.file?(path)
  next unless output_extensions.include?(File.extname(path))

  output_relative = relative_path(path).delete_prefix(".responsive-image-cache/")
  FileUtils.rm_f(path) unless expected_outputs[output_relative]
end

File.write(MANIFEST_PATH, JSON.pretty_generate(new_manifest))
puts "Responsive images: reused #{reused}, generated #{generated}, sources #{new_manifest["sources"].size}"
