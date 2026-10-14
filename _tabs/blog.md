---
icon: fas fa-rss
order: 2
title: 블로그
permalink: /blog/
---

{% include lang.html %}

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
  <article class="card-wrapper card"{% if color != '' %} style="--c: {{ color }}"{% endif %}>
    <a href="{{ post.url | relative_url }}" class="post-preview row g-0 flex-md-row-reverse">
      <div class="col-md-12">
        <div class="card-body d-flex flex-column">
          <h1 class="card-title my-2 mt-md-0">{{ post.title }}</h1>
          <div class="card-text content mt-0 mb-3">
            <p>{{ post.content | strip_html | truncate: 140 }}</p>
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
