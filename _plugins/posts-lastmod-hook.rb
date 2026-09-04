#!/usr/bin/env ruby
#
# 글이 두 번 이상 커밋됐으면 last_modified_at 을 git 이력에서 채운다 (Chirpy 표준).

Jekyll::Hooks.register :posts, :post_init do |post|
  commit_num = `git rev-list --count HEAD "#{post.path}"`

  if commit_num.to_i > 1
    lastmod_date = `git log -1 --pretty="%ad" --date=iso "#{post.path}"`
    post.data['last_modified_at'] = lastmod_date
  end
end
