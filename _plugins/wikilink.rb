#!/usr/bin/env ruby
#
# 본문의 [[slug]] 또는 [[slug|보일 텍스트]] 를 해당 글 링크로 바꾼다.
# slug 는 파일명에서 날짜를 뗀 부분 ( _posts/2026-09-04-relu.md -> "relu" -> /posts/relu/ ).
# 매칭되는 글이 없으면 링크 없이 텍스트만 남긴다.

module Hoteasik
  def self.slug_of(doc)
    doc.data["slug"] || doc.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, "")
  end

  # 코드 블록과 인라인 코드는 건드리지 않는다 (파이썬 리스트 [[0, 1]] 보호).
  def self.expand(text, index)
    text.gsub(/(^```.*?^```|`[^`\n]+`)|\[\[([^\]|\n]+?)(?:\|([^\]\n]+?))?\]\]/m) do
      next Regexp.last_match(0) if Regexp.last_match(1)

      slug  = Regexp.last_match(2).strip
      label = (Regexp.last_match(3) || "").strip
      target = index[slug]

      if target
        linked = label.empty? ? target.data["title"] : label
        "[#{linked}](#{target.url})"
      else
        label.empty? ? slug : label
      end
    end
  end
end

# 첫 렌더링 전에 전체를 바꾼다. 글별 훅을 쓰면 검색 설명과 관련 글 카드에 [[slug]] 가 남는다.
Jekyll::Hooks.register :site, :pre_render do |site|
  index = {}
  site.posts.docs.each { |p| index[Hoteasik.slug_of(p)] = p }

  (site.posts.docs + site.pages).each do |doc|
    doc.content = Hoteasik.expand(doc.content, index) if doc.content.is_a?(String)

    excerpt = doc.data["excerpt"]
    excerpt.content = Hoteasik.expand(excerpt.content, index) if excerpt.respond_to?(:content=)
  end
end
