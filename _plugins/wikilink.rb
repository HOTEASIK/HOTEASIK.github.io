#!/usr/bin/env ruby
#
# 본문의 [[slug]] 또는 [[slug|보일 텍스트]] 를 해당 글 링크로 바꾼다.
# slug 는 파일명에서 날짜를 뗀 부분 ( _posts/2026-09-04-relu.md -> "relu" -> /posts/relu/ ).
# 매칭되는 글이 없으면 링크 없이 텍스트만 남긴다.

module Hoteasik
  def self.slug_of(doc)
    doc.data["slug"] || doc.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, "")
  end
end

Jekyll::Hooks.register [:posts, :pages], :pre_render do |doc|
  content = doc.content
  next unless content.is_a?(String) && content.include?("[[")

  index = {}
  doc.site.posts.docs.each { |p| index[Hoteasik.slug_of(p)] = p }

  doc.content = content.gsub(/\[\[([^\]|\n]+?)(?:\|([^\]\n]+?))?\]\]/) do
    slug  = Regexp.last_match(1).strip
    label = (Regexp.last_match(2) || "").strip
    target = index[slug]

    if target
      text = label.empty? ? target.data["title"] : label
      "[#{text}](#{target.url})"
    else
      label.empty? ? slug : label
    end
  end
end
