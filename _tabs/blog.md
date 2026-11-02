---
icon: fas fa-rss
order: 2
title: 블로그
permalink: /blog/
---

{% include lang.html %}

{%- assign filter_cats = '' | split: '' -%}
{%- for c in site.categories -%}{%- assign filter_cats = filter_cats | push: c[0] -%}{%- endfor -%}
{%- assign filter_cats = filter_cats | sort_natural -%}
{%- assign filter_tags = '' | split: '' -%}
{%- for t in site.tags -%}{%- assign filter_tags = filter_tags | push: t[0] -%}{%- endfor -%}
{%- assign filter_tags = filter_tags | sort_natural -%}
<section id="post-filter" aria-label="글 필터">
  <div class="filter-row">
    <span class="filter-label">분야</span>
    {% for c in filter_cats %}<button type="button" data-key="cats" data-value="{{ c }}" aria-pressed="false">{{ c }}</button>{% endfor %}
  </div>
  <div class="filter-row">
    <span class="filter-label">태그</span>
    {% for t in filter_tags %}<button type="button" data-key="tags" data-value="{{ t }}" aria-pressed="false">{{ t }}</button>{% endfor %}
  </div>
  <div class="filter-foot">
    <span id="filter-count" role="status"></span>
    <button type="button" class="filter-clear" hidden>필터 지우기</button>
  </div>
</section>

<div id="post-list" class="flex-grow-1 px-xl-1">
{% for post in site.posts %}
  {%- comment -%} 폴더 경로(_posts/AI/부품/…)로 팩 경로와 색(가장 깊은 팩 색)을 정한다 {%- endcomment -%}
  {%- assign segs = post.path | split: '/' -%}
  {%- assign n = segs.size | minus: 2 -%}
  {%- assign trail = '' -%}
  {%- assign color = '' -%}
  {%- if n > 0 -%}
    {%- assign folders = segs | slice: 1, n -%}
    {%- assign trail = folders | join: ' › ' -%}
    {%- for f in folders -%}
      {%- if site.data.packs[f].color -%}{%- assign color = site.data.packs[f].color -%}{%- endif -%}
    {%- endfor -%}
  {%- endif -%}
  <article class="card-wrapper card"{% if color != '' %} style="--c: {{ color }}"{% endif %} data-cats="{{ post.categories | join: '|' }}" data-tags="{{ post.tags | join: '|' }}">
    <a href="{{ post.url | relative_url }}" class="post-preview row g-0 flex-md-row-reverse">
      <div class="col-md-12">
        <div class="card-body d-flex flex-column">
          <h2 class="card-title my-2 mt-md-0">{{ post.title }}</h2>
          <div class="card-text content mt-0 mb-3">
            <p>{{ post.excerpt | strip_html | truncate: 140 }}</p>
          </div>
          <div class="post-meta flex-grow-1 d-flex align-items-end">
            <div class="me-auto">
              {% if trail != '' %}<span class="cp-trail me-2">{{ trail }}</span>{% endif %}
              <i class="far fa-calendar fa-fw me-1"></i>
              {% include datetime.html date=post.date lang=lang %}
              {% if post.categories.size > 0 %}
                <i class="far fa-folder-open fa-fw me-1 ms-2"></i>
                <span class="categories">
                  {% for category in post.categories %}{{ category }}{% unless forloop.last %}, {% endunless %}{% endfor %}
                </span>
              {% endif %}
            </div>
          </div>
        </div>
      </div>
    </a>
  </article>
{% endfor %}
</div>

<script defer src="{{ '/assets/js/blog-filter.js' | relative_url }}"></script>
