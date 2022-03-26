import jsonLogic from 'json-logic-js'
import { find } from 'lodash'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Organization, Project } from 'types'

export function usePermissions(action: string, resource: string) {
  const url = `${API_URL}/profile/permissions`
  const { data: permissions, error } = useSWR<any>(url, get)
  if (error || !permissions || permissions.error) {
    return false
  }

  let organization_id: number | undefined
  const { app } = useStore()
  const router = useRouter()
  const { ref, slug } = router.query
  if (ref) {
    const project = find(app.projects.list(), { ref }) as Project | undefined
    organization_id = project?.organization_id
  } else if (slug) {
    const organization = find(app.projects.list(), { ref }) as Organization | undefined
    organization_id = organization?.id
  }

  const conditions = permissions.map(
    (permission: {
      actions: string[]
      condition: jsonLogic.RulesLogic
      organization_id: number
      resources: string[]
    }) =>
      permission.actions.includes(action) &&
      permission.resources.includes(resource) &&
      permission.organization_id === organization_id
        ? permission.condition
        : undefined
  )
  return conditions.some(
    (condition: jsonLogic.RulesLogic) =>
      condition !== undefined && (condition === null || jsonLogic.apply(condition))
  )
}
