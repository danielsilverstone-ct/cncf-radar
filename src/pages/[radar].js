import { useState } from 'react'
import css from 'styled-jsx/css'
import loadData from '../loadData'
import withTitle from '../components/withTitle'
import MarkdownComponent from '../components/MarkdownComponent'
import Section from '../components/Section'
import RadarTeam from '../components/RadarTeam'
import Radar from '../components/Radar'
import RadarData from '../components/RadarData'
import CompanySizeChart from '../components/CompanySizeChart'
import VideoComponent from '../components/VideoComponent'
import Companies from '../components/Companies'
import IndustriesTable from '../components/IndustriesTable'
import GlobalTextComponent from '../components/GlobalTextComponent'
import OutboundLink from '../components/OutboundLink'
import ThumbnailsList from '../components/ThumbnailsList'

const Columns = ({ children }) => {
  return <div class="columns is-desktop is-4">
    <style jsx>{`
      .columns {
        margin-top: 0;
      }
    `}</style>
    {children}
  </div>
}

const Column = ({ children }) => {
  return <div className="column is-half-desktop">
    <style jsx>{`
      .column {
        margin-top: 1.25rem;
      }
    `}</style>

    {children}
  </div>
}

const RadarSection = ({ name, points, radarKey, themes }) => {
  const [collapsed, setCollapsed] = useState(true)
  const toggleCollapsed = _ => setCollapsed(!collapsed)

  const { className, styles } = css.resolve`
    margin-top: 10px;
  `

  return <Section title={name}>
    <style jsx>{`
      .radar-wrapper {  
        max-width: 800px;
        margin: 0 auto;
      }
      
      .download {
        margin-top: 10px;
        text-align: center;
        font-size: 0.95rem;
      }
      
      .theme {
        margin: 0 10px 30px;
      }
      
      h4 {
        color: #202020;
      }
      
      .toggle {
        text-align: center;
      }
    `}</style>

    {styles}

    <Columns>
      <Column>
        <div className="radar-wrapper">
          <Radar points={points} />
          <div className="download">
            Download as <OutboundLink href={`/${radarKey}.svg`} title="svg" /> or <OutboundLink href={`/${radarKey}.png`} title="png" />
          </div>
        </div>
      </Column>

      { themes.length > 0 && <Column>
        {themes.map((theme, idx) => {
          return <div className="theme">
            <h4>{idx + 1}. {theme.headline}</h4>
            {!collapsed && <MarkdownComponent className={className} value={theme.content} />}
          </div>
        })}

        <div className="toggle">
          <a onClick={toggleCollapsed}>Show { collapsed ? 'More' : 'Less' }</a>
        </div>
      </Column> }
    </Columns>
  </Section>
}

const WebinarSection = ({ video }) => {
  return <Section title="Webinar">
    <VideoComponent src={video} />
  </Section>
}

const TeamSection = ({ team }) => {
  return <Section title="Team">
    <RadarTeam team={team}/>
  </Section>
}

const CompaniesSection = ({ companies }) => {
  const { className, styles } = css.resolve`
    div {
      text-align: center;
      color: #666;
      font-size: 1rem;
      font-style: italic;
    }  
  `

  return  <Section title="Participating CNCF End User Community Members">
    {styles}
    <Companies companies={companies} />
    <GlobalTextComponent name="hidden_companies" className={className} />
  </Section>
}

const DataSection = ({ points, companies }) => {
  return <Section title="CNCF End User Community Member Recommendations">
    <RadarData points={points}/>

    {companies && <Columns>
      <Column>
        <CompanySizeChart companies={companies} />
      </Column>

      <Column>
        <IndustriesTable companies={companies} />
      </Column>
    </Columns>}
  </Section>
}

const renderSection = ({ title, content }) => {
  return <Section title={title} key={title}>
    <MarkdownComponent value={content} />
  </Section>
}

const OtherRadarsSection = ({ radars }) => {
  return <Section title="Other Radars">
    <ThumbnailsList radars={radars} />
  </Section>
}

const RadarPage = ({ radar, otherRadars = [] }) => {
  const { name, points, team, video, companies, key, sections = [], themes } = radar
  const defaultSections = [
    <RadarSection name={name} points={points} radarKey={key} themes={themes} key="radar" />,
    <CompaniesSection companies={companies} key="companies" />,
    video && <WebinarSection video={video} key="video" />,
    <TeamSection team={team} key="team" />,
    <DataSection points={points} companies={companies} key="data" />
  ].filter(_ => _).map((section, i) => [i + 1, section])

  const positionedSections = sections.filter(section => section.position)
    .sort((a, b) => a.position - b.position)
    .map(section => [section.position, renderSection(section)])

  const additionalSections = sections.filter(section => !section.position)
    .map(section => renderSection(section))

  const sortedSections = [...positionedSections, ...defaultSections]
    .sort((a, b) => a[0] - b[0])
    .map(([_, section]) => section)

  return <>
    {sortedSections}
    {additionalSections}
    {otherRadars.length > 0 && <OtherRadarsSection radars={otherRadars} />}
  </>
}

export async function getStaticProps ({ params }) {
  const { radars } = await loadData()
  const radar = radars.find(({ key, draft }) => params ? key === params.radar : !draft)
  const otherRadars = radars.filter(r => !r.draft && r.key !== radar.key)
    .map(({ key, name }) => ({ key, name }))
  return { props: { radar, otherRadars } }
}

export async function getStaticPaths() {
  const { radars } = await loadData()

  return {
    paths: radars.map(({ key }) => ({ params: { radar: key } })),
    fallback: false
  };
}

export default withTitle(RadarPage, props => props.radar.name)
